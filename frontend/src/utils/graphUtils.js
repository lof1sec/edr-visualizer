// Utility functions for converting EDR logs into Cytoscape elements

const getAdditionalFieldsDict = (event) => {
  const fields = event.AdditionalFields || "";
  if (typeof fields === 'object') {
    return fields;
  }
  if (typeof fields === 'string' && fields.trim().startsWith('{')) {
    try {
      return JSON.parse(fields);
    } catch (e) {
      // pass
    }
  }
  return {};
};

// Map cytoscape group styles to shapes
// Groups used: process, file, module, registry, network, commandline, alert
export const parseEDRLogs = (logs) => {
  const nodes = {};
  const edges = {};

  const getOrCreateProcessNode = (pid, name, username, evtType, eventObj) => {
    if (!pid) return;

    let strPid = String(pid);
    if (!nodes[strPid]) {
      const displayName = name ? name : "Unknown";
      let label = name ? `${displayName}\n${pid}` : `Process ID:\n${pid}`;
      if (username) {
        const icon = String(username).endsWith("$") ? "💻" : "👤";
        label += `\n${icon} ${username}`;
      }

      const actionsList = evtType ? [evtType] : [];
      nodes[strPid] = {
        data: {
          id: strPid,
          label: label,
          group: "process",
          username: username,
          process_name: name,
          actions: actionsList,
          events: eventObj ? [eventObj] : []
        }
      };
    } else {
      const node = nodes[strPid].data;
      if (eventObj) node.events.push(eventObj);

      let currentLabel = node.label || "";
      let currentUsername = node.username;
      let currentName = node.process_name;
      let actionsList = node.actions || [];

      if (evtType && !actionsList.includes(evtType)) {
        actionsList.push(evtType);
        node.actions = actionsList;
      }

      if (name && !currentName) {
        node.process_name = name;
        if (currentLabel.startsWith("Process ID:")) {
          node.label = currentLabel.replace("Process ID:", name);
        }
      }

      if (username && !currentUsername) {
        node.username = username;
        const icon = String(username).endsWith("$") ? "💻" : "👤";
        if (!node.label.includes("👤") && !node.label.includes("💻")) {
          node.label += `\n${icon} ${username}`;
        }
      }
    }
  };

  const addOrUpdateArtifactNode = (nodeId, label, group, eventObj) => {
    if (!nodeId) return;
    let strId = String(nodeId);

    if (!nodes[strId]) {
      nodes[strId] = {
        data: {
          id: strId,
          label: label,
          group: group,
          events: eventObj ? [eventObj] : []
        }
      };
    } else {
      if (eventObj) nodes[strId].data.events.push(eventObj);
    }
  };

  const addEdge = (source, target, label, color, dashed) => {
    if (!source || !target) return;
    const edgeId = `${source}-${target}-${label}`;
    if (!edges[edgeId]) {
      edges[edgeId] = {
        data: {
          id: edgeId,
          source: String(source),
          target: String(target),
          label: label,
          color: color || '#a6a6a6',
          dashed: !!dashed
        }
      };
    }
  };

  logs.forEach((log) => {
    const isCrowdStrike = log.hasOwnProperty('#event_simpleName');
    // Normalize basic fields for CS vs MDE
    const evtType = log.ActionType || log.EventName || "UnknownEvent";

    let actorId, actorName, targetId, targetName, domain, user, username;

    if (isCrowdStrike) {
      actorId = log.ParentProcessId;
      actorName = "Unknown";
      targetId = log.TargetProcessId;
      targetName = log.ImageFileName ? log.ImageFileName.split('\\').pop() : 'Unknown';
      username = log.UserName || "Unknown";
    } else {
      actorId = log.InitiatingProcessId;
      actorName = log.InitiatingProcessFileName;
      targetId = log.ProcessId;
      targetName = log.FileName;
      domain = log.AccountDomain || "";
      user = log.AccountName || "Unknown";
      username = domain && user !== "Unknown" ? `${domain}\\${user}` : user;
    }


    if (isCrowdStrike) {
      const evtType = log["#event_simpleName"] || "UnknownEvent";

      const targetId = log.TargetProcessId;
      const parentId = log.ParentProcessId;
      const contextId = log.ContextProcessId;
      const sourceId = log.SourceProcessId;

      const parentName = log.ParentBaseFileName;
      const contextName = log.ContextBaseFileName;
      const username = log.UserName;

      const hashStr = (str) => {
        let hash = 0;
        if (!str || str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
          let char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash);
      };

      if (evtType === "ProcessRollup2") {
        const cmdline = log.CommandLine || "No CommandLine";
        const imageFile = log.ImageFileName ? log.ImageFileName.split('\\').pop() : "Unknown Process";

        if (parentId && targetId) {
          getOrCreateProcessNode(parentId, parentName, null, evtType, log);
          getOrCreateProcessNode(targetId, imageFile, username, evtType, log);

          addEdge(parentId, targetId, "Spawns", "#ff4d4d", false);

          if (sourceId && sourceId !== parentId) {
            getOrCreateProcessNode(sourceId, null, null, evtType, log);
            addEdge(sourceId, targetId, "True Source", "#ff33cc", true);
          }

          if (cmdline && cmdline !== "No CommandLine") {
            const cmdNodeId = `cmd_${targetId}`;
            const wrappedCmd = cmdline.match(/.{1,60}/g)?.join('\n') || cmdline;
            addOrUpdateArtifactNode(cmdNodeId, wrappedCmd, "commandline", log);
            addEdge(targetId, cmdNodeId, "Args", "#ffcc00", true);
          }
        }
      } else if (evtType === "ProcessAncestryInformation") {
        const baseFile = log.BaseFileName ? log.BaseFileName.split('\\').pop() : "";
        const actorId = contextId || targetId;
        if (actorId) {
          getOrCreateProcessNode(actorId, baseFile, username, evtType, log);
        }
      } else if (evtType === "AssociateIndicator") {
        const actorId = targetId || contextId;
        if (actorId) {
          getOrCreateProcessNode(actorId, contextName, username, evtType, log);

          const detectName = log.DetectName || "Unknown Detection";
          const severity = log.DetectSeverity || "0";
          const alertNodeId = `alert_${actorId}_${log.timestamp}`;
          const displayLabel = `ALERT: ${detectName}\nSeverity: ${severity}`;

          addOrUpdateArtifactNode(alertNodeId, displayLabel, "alert", log);
          addEdge(actorId, alertNodeId, "Triggers Alert", "#ff0000", false);
        }
      } else if (["UserLogon", "UserIdentity", "IoSessionLoggedOn"].includes(evtType)) {
        const actorId = contextId || sourceId;
        if (actorId) {
          getOrCreateProcessNode(actorId, contextName, username, evtType, log);
          const logonType = log.LogonType || "Unknown";
          const domain = log.LogonDomain || "";
          const userLogon = log.UserName || "Unknown";
          const logonNodeId = `logon_${actorId}_${log.timestamp}`;
          const displayLabel = `Session: ${evtType}\nType: ${logonType}\n${domain}\\${userLogon}`;
          addOrUpdateArtifactNode(logonNodeId, displayLabel, "commandline", log);
          addEdge(actorId, logonNodeId, "Auth Action", "#33cc33", true);
        }
      } else if ([
        "NewScriptWritten", "ScriptFileWrittenInfo", "DirectoryCreate", "CrxFileWritten", "PngFileWritten","CabFileWritten",
        "DmpFileWritten","EseFileWritten","GifFileWritten","GzipFileWritten","JpegFileWritten","LnkFileWritten","MotwWritten",
        "NewExecutableWritten","OleFileWritten","PeFileWritten","PythonFileWritten","RegistryHiveFileWritten","WebScriptFileWritten",
        "ZipFileWritten","ELFFileWritten","ADExplorerFileWritten","AgenticGenericFileWritten","AppleScriptFileWritten","ArcFileWritten",
        "ArjFileWritten","AsifFileWritten","BZip2FileWritten","Base64PeFileWritten","BcmFileWritten","BlakHoleFileWritten","BlfFileWritten",
        "BmpFileWritten","BrotliFileWritten","CabFileWritten","CustomIOAFileWrittenDetectionInfoEvent","DebFileWritten","DexFileWritten",
        "DmgFileWritten","DwgFileWritten","DxfFileWritten","EmailArchiveFileWritten","EmailFileWritten","FileWrittenAndExecutedInContainer",
        "FileWrittenWithEntropyHigh","FreeArcFileWritten","GenericFileWritten","IdwFileWritten","ImgExtensionFileWritten","IsoExtensionFileWritten",
        "JarFileWritten","JavaClassFileWritten","LRZipFileWritten","LZ4FileWritten","LZOFileWritten","LZipFileWritten","LhaFileWritten",
        "LzfseFileWritten","LzmaFileWritten","MSDocxFileWritten","MSPptxFileWritten","MSVsdxFileWritten","MSXlsxFileWritten","MachOFileWritten",
        "MsiFileWritten","OoxmlFileWritten","PackedExecutableWritten","PdfFileWritten","PeaFileWritten","PemFileWritten","PngFileWritten",
        "RarFileWritten","RemovableMediaFileWritten","RpmFileWritten","RtfFileWritten","SevenZipFileWritten","SldFileWritten","SourceCodeFileWritten",
        "SuspiciousEseFileWritten","SuspiciousPeFileWritten","TarFileWritten","TiffFileWritten","UnixFileWritten","VdiFileWritten","VmdkFileWritten",
        "XarFileWritten","XzFileWritten","Yz1FileWritten","ZipFileWritten","ZpaqFileWritten","ZstdFileWritten"
      ].includes(evtType)) {
        const fileName = log.TargetFileName || log.FileName || "";
        if (contextId && fileName) {
          getOrCreateProcessNode(contextId, contextName, username, evtType, log);
          const cleanPath = fileName.replace(/\\/g, '/');
          const shortName = cleanPath.replace(/\/$/, '').split('/').pop();
          const displayFile = shortName.length > 50 ? shortName.substring(0, 50) + "..." : shortName;
          const safeFileId = `file_${hashStr(fileName)}`;
          addOrUpdateArtifactNode(safeFileId, displayFile, "file", log);
          addEdge(contextId, safeFileId, evtType, "#4da6ff", false);
        }
      } else if (evtType === "ExecutableDeleted") {
        const fileName = log.TargetFileName || log.FileName || "";
        const actorId = contextId || sourceId;
        if (actorId && fileName) {
          getOrCreateProcessNode(actorId, contextName, username, evtType, log);
          const cleanPath = fileName.replace(/\\/g, '/');
          const shortName = cleanPath.replace(/\/$/, '').split('/').pop();
          const displayFile = shortName.length > 50 ? shortName.substring(0, 50) + "..." : shortName;
          const safeFileId = `file_${hashStr(fileName)}`;
          addOrUpdateArtifactNode(safeFileId, displayFile, "file", log);
          addEdge(actorId, safeFileId, "Deletes File", "#ff6666", true);
        }
      } else if (evtType === "SuspiciousCreateSymbolicLink") {
        const actorId = contextId || sourceId;
        if (actorId) {
          getOrCreateProcessNode(actorId, contextName, username, evtType, log);
          const symlink = log.SymbolicLinkName || "";
          const symNodeId = `sym_${hashStr(symlink)}`;
          let displayLabel = symlink.replace(/\\/g, '/').split('/').pop();
          displayLabel = displayLabel.length > 50 ? displayLabel.substring(0, 50) + "..." : displayLabel;
          addOrUpdateArtifactNode(symNodeId, `SymLink:\n${displayLabel}`, "alert", log);
          addEdge(actorId, symNodeId, "Creates SymLink", "#ff0000", true);
        }
      } else if (["ScheduledTaskModified", "FirewallSetRule", "FirewallDeleteRule"].includes(evtType)) {
        const actorId = log.RpcClientProcessId || contextId || sourceId;
        if (actorId) {
          getOrCreateProcessNode(actorId, contextName, username, evtType, log);
          if (evtType === "ScheduledTaskModified") {
            const taskName = log.TaskName || "Unknown_Task";
            const nodeId = `task_${hashStr(taskName)}`;
            const displayLabel = `Task:\n${taskName.replace(/\\/g, '/').split('/').pop()}`;
            addOrUpdateArtifactNode(nodeId, displayLabel, "commandline", log);
            addEdge(actorId, nodeId, "Modifies Task", "#ff9933", false);
          } else {
            const ruleId = log.FirewallRuleId || "Unknown_Rule";
            const nodeId = `fw_${hashStr(ruleId)}`;
            const displayLabel = `FW Rule:\n${ruleId.substring(0, 30)}`;
            addOrUpdateArtifactNode(nodeId, displayLabel, "network", log);
            const actionLabel = evtType === "FirewallSetRule" ? "Sets FW Rule" : "Deletes FW Rule";
            const edgeColor = evtType === "FirewallDeleteRule" ? "#ff0000" : "#ff9933";
            addEdge(actorId, nodeId, actionLabel, edgeColor, false);
          }
        }
      } else if (evtType === "DriverLoad") {
        const driverPath = log.ImageFileName || "";
        const actorId = contextId || sourceId;
        if (actorId && driverPath) {
          const shortDriver = driverPath.split('\\').pop();
          getOrCreateProcessNode(actorId, contextName, username, evtType, log);
          addOrUpdateArtifactNode(driverPath, shortDriver, "module", log);
          addEdge(actorId, driverPath, "Loads Driver", "#b366ff", false);
        }
      } else if (["AsepValueUpdate", "RegKeyCommit", "RegValueCommit", "RegSystemConfigValueUpdate"].includes(evtType)) {
        const regKey = log.RegObjectName || "";
        const regValue = log.RegValueName || "";
        const actorId = contextId || sourceId;
        if (actorId && regKey) {
          const regNodeId = regValue ? `${regKey}\\${regValue}` : regKey;
          const rawReg = regValue ? regValue : regKey.split('\\').pop();
          const displayReg = rawReg.length > 50 ? rawReg.substring(0, 50) + "..." : rawReg;
          getOrCreateProcessNode(actorId, contextName, username, evtType, log);
          addOrUpdateArtifactNode(regNodeId, displayReg, "registry", log);
          addEdge(actorId, regNodeId, "Reg Update", "#ff9933", false);
        }
      } else if (["NetworkReceiveAcceptIP4", "NetworkConnectIP4", "NetworkConnectIP6", "DnsRequest"].includes(evtType)) {
        const remoteIp = log.RemoteAddressIP4 || "";
        const domain = log.DomainName || "";
        const actorId = contextId || sourceId;
        if (actorId && (remoteIp || domain)) {
          getOrCreateProcessNode(actorId, contextName, username, evtType, log);
          if (evtType === "DnsRequest") {
            const dnsNodeId = `dns_${domain}`;
            addOrUpdateArtifactNode(dnsNodeId, domain, "network", log);
            addEdge(actorId, dnsNodeId, "DNS Query", "#00ffff", false);
          } else {
            const remotePort = log.RemotePort || "";
            const netNodeId = `${remoteIp}:${remotePort}`;
            addOrUpdateArtifactNode(netNodeId, netNodeId, "network", log);
            addEdge(actorId, netNodeId, evtType, "#00ffff", false);
          }
        }
      } else if (["NeighborListIP4", "LFODownloadConfirmation", "ModuleCertificateInfo2", "UserLogoff"].includes(evtType)) {
        const hostNodeId = `host_${log.ComputerName || 'UnknownHost'}`;
        addOrUpdateArtifactNode(hostNodeId, `Host:\n${log.ComputerName || 'Unknown'}`, "network", log);
        const nodeHash = hashStr(String(log.timestamp || Date.now()));
        const nodeId = `floating_${evtType}_${nodeHash}`;

        if (evtType === "NeighborListIP4") {
          addOrUpdateArtifactNode(nodeId, "ARP Neighbor List", "network", log);
          addEdge(hostNodeId, nodeId, "Network Intel", "#00ffff", true);
        } else if (evtType === "LFODownloadConfirmation") {
          const fileName = log.TargetFileName || "";
          addOrUpdateArtifactNode(nodeId, `LFO Download:\n${fileName}`, "file", log);
          addEdge(hostNodeId, nodeId, "Service Download", "#4da6ff", true);
        } else if (evtType === "ModuleCertificateInfo2") {
          const sha256 = log.SHA256HashData || "";
          addOrUpdateArtifactNode(nodeId, `Cert Info\n${sha256.substring(0, 8)}...`, "module", log);
          addEdge(hostNodeId, nodeId, "Cert Telemetry", "#b366ff", true);
        } else if (evtType === "UserLogoff") {
          const authId = log.AuthenticationId || "";
          addOrUpdateArtifactNode(nodeId, `Session End\nID: ${authId}`, "commandline", log);
          addEdge(hostNodeId, nodeId, "Logoff", "#a6a6a6", true);
        }
      } else if (evtType === "CommandHistory") {
        const cmdHistory = log.CommandHistory || "";
        const actorId = targetId || contextId;
        if (actorId && cmdHistory) {
          getOrCreateProcessNode(actorId, null, username, evtType, log);
          const cmdNodeId = `cmdhist_${actorId}_${hashStr(cmdHistory)}`;
          const wrappedCmd = cmdHistory.match(/.{1,60}/g)?.join('\n') || cmdHistory;
          addOrUpdateArtifactNode(cmdNodeId, wrappedCmd, "commandline", log);
          addEdge(actorId, cmdNodeId, "History", "#ffcc00", true);
        }
      } else {
        const actorId = contextId || sourceId || parentId;
        if (actorId && targetId && actorId !== targetId) {
          getOrCreateProcessNode(actorId, contextName || parentName, username, evtType, log);
          getOrCreateProcessNode(targetId, null, null, evtType, log);
          addEdge(actorId, targetId, evtType, "#a6a6a6", false);
        }
      }
      return; // Skip the rest of the parsing logic, which is for Defender
    }

    // MDE Logic matches Jupiter Notebook
    switch (evtType) {
      case "ProcessCreated": {
        const cmdline = log.ProcessCommandLine || "No CommandLine";
        if (actorId && targetId) {
          getOrCreateProcessNode(actorId, actorName, username, evtType, log);
          getOrCreateProcessNode(targetId, targetName, username, evtType, log);
          addEdge(actorId, targetId, "Spawns", "#ff4d4d", false);

          if (cmdline && cmdline !== "No CommandLine") {
            const cmdNodeId = `cmd_${targetId}`;
            // Simple text wrap simulation
            const wrappedCmd = cmdline.match(/.{1,60}/g)?.join('\n') || cmdline;
            addOrUpdateArtifactNode(cmdNodeId, wrappedCmd, "commandline", log);
            addEdge(targetId, cmdNodeId, "Args", "#ffcc00", true);
          }
        }
        break;
      }

      case "PowerShellCommand": {
        const addFields = getAdditionalFieldsDict(log);
        const psCommand = addFields.Command || String(log.AdditionalFields || "");
        if (actorId && psCommand) {
          getOrCreateProcessNode(actorId, actorName, username, evtType, log);
          const cmdHash = Math.abs(psCommand.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0));
          const cmdNodeId = `pscmd_${actorId}_${cmdHash}`;
          const wrappedCmd = psCommand.match(/.{1,60}/g)?.join('\n') || psCommand;
          addOrUpdateArtifactNode(cmdNodeId, wrappedCmd, "commandline", log);
          addEdge(actorId, cmdNodeId, "Executes PS", "#ffcc00", true);
        }
        break;
      }

      case "ClrUnbackedModuleLoaded": {
        const addFields = getAdditionalFieldsDict(log);
        const moduleName = addFields.ModuleILPathOrName || "Unbacked CLR Assembly";
        if (actorId) {
          getOrCreateProcessNode(actorId, actorName, username, evtType, log);
          const modHash = Math.abs(moduleName.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0));
          const clrNodeId = `clr_${actorId}_${modHash}`;
          const displayClr = `Unbacked CLR\n${moduleName.substring(0, 30)}`;
          addOrUpdateArtifactNode(clrNodeId, displayClr, "module", log);
          addEdge(actorId, clrNodeId, "Loads Unbacked CLR", "#b366ff", true);
        }
        break;
      }

      case "LdapSearch": {
        const addFields = getAdditionalFieldsDict(log);
        const searchFilter = addFields.SearchFilter || "Unknown Filter";
        if (actorId) {
          getOrCreateProcessNode(actorId, actorName, username, evtType, log);
          const filterHash = Math.abs(searchFilter.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0));
          const ldapNodeId = `ldap_${actorId}_${filterHash}`;
          const displayLdap = searchFilter.length > 30 ? `LDAP Search\n${searchFilter.substring(0, 30)}...` : `LDAP Search\n${searchFilter}`;
          addOrUpdateArtifactNode(ldapNodeId, displayLdap, "commandline", log);
          addEdge(actorId, ldapNodeId, "LDAP Query", "#ffcc00", true);
        }
        break;
      }

      case "PnpDeviceAllowed":
      case "PnpDeviceConnected": {
        const addFields = getAdditionalFieldsDict(log);
        const deviceId = addFields.DeviceInstanceId || "Unknown Device";
        const driverName = addFields.DriverName || "Unknown Driver";
        const pnpActor = actorId ? actorId : "SYSTEM_PNP";
        const pnpActorName = actorName ? actorName : "Plug and Play Manager";

        getOrCreateProcessNode(pnpActor, pnpActorName, username, evtType, log);
        const devHash = Math.abs(deviceId.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0));
        const pnpNodeId = `pnp_${devHash}`;
        const displayPnp = `PnP Device\n${driverName}`;
        addOrUpdateArtifactNode(pnpNodeId, displayPnp, "module", log);
        addEdge(pnpActor, pnpNodeId, "Loads Device", "#b366ff", true);
        break;
      }

      case "GetClipboardData": {
        if (actorId) {
          getOrCreateProcessNode(actorId, actorName, username, evtType, log);
          const clipNodeId = `clip_${actorId}`;
          addOrUpdateArtifactNode(clipNodeId, "📋 Clipboard Data", "commandline", log);
          addEdge(actorId, clipNodeId, "Reads Clipboard", "#ffcc00", true);
        }
        break;
      }

      case "ProcessCreatedUsingWmiQuery": {
        const addFields = getAdditionalFieldsDict(log);
        const clientMachine = addFields.ClientMachine || "Local";
        const wmiActor = actorId ? actorId : "WMI_Subsystem";
        const wmiActorName = actorName ? actorName : "WMI Engine";

        getOrCreateProcessNode(wmiActor, wmiActorName, username, evtType, log);
        const wmiHash = Math.abs(JSON.stringify(addFields).split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0));
        const wmiNodeId = `wmi_query_${wmiHash}`;
        addOrUpdateArtifactNode(wmiNodeId, `WMI Query\n(${clientMachine})`, "commandline", log);
        addEdge(wmiActor, wmiNodeId, "WMI Query", "#ffcc00", true);
        break;
      }

      case "NamedPipeEvent": {
        const addFields = getAdditionalFieldsDict(log);
        const pipeName = addFields.PipeName;
        const fileOp = addFields.FileOperation || "NamedPipeEvent";

        if (actorId && pipeName) {
          getOrCreateProcessNode(actorId, actorName, username, evtType, log);
          let displayPipe = pipeName.includes('\\') ? pipeName.split('\\').pop() : pipeName;
          if (displayPipe.length > 50) displayPipe = displayPipe.substring(0, 50) + "...";
          addOrUpdateArtifactNode(pipeName, displayPipe, "file", log);
          addEdge(actorId, pipeName, fileOp, "#4da6ff", true);
        }
        break;
      }

      case "DpapiAccessed": {
        const addFields = getAdditionalFieldsDict(log);
        const operationType = addFields.OperationType || "Unknown DPAPI Op";
        const masterKeyGuid = addFields.MasterKeyGUID || "Unknown GUID";
        if (actorId) {
          getOrCreateProcessNode(actorId, actorName, username, evtType, log);
          const dpapiNodeId = `dpapi_${masterKeyGuid}`;
          const displayName = `DPAPI\n${operationType}`;
          addOrUpdateArtifactNode(dpapiNodeId, displayName, "module", log);
          addEdge(actorId, dpapiNodeId, operationType, "#b366ff", true);
        }
        break;
      }

      case "BrowserLaunchedToOpenUrl": {
        const launchedUrl = log.RemoteUrl || "";
        if (actorId && launchedUrl) {
          getOrCreateProcessNode(actorId, actorName, username, evtType, log);
          const urlHash = Math.abs(launchedUrl.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0));
          const urlNodeId = `url_${urlHash}`;
          const displayUrl = launchedUrl.length > 50 ? launchedUrl.substring(0, 50) + "..." : launchedUrl;
          addOrUpdateArtifactNode(urlNodeId, displayUrl, "network", log);
          addEdge(actorId, urlNodeId, "Launches URL", "#00ffff", true);
        }
        break;
      }

      case "AntivirusReport": {
        const fileName = log.FileName || "Unknown Threat";
        const sha1 = log.SHA1 || "N/A";
        const avActor = actorId ? actorId : "SYSTEM_AV";
        const avActorName = actorName ? actorName : "Windows Defender Engine";

        getOrCreateProcessNode(avActor, avActorName, username, evtType, log);
        const alertNodeId = `av_alert_${fileName}_${sha1}`;
        const displayName = `⚠️ AV ALERT\n${fileName.substring(0, 25)}`;
        addOrUpdateArtifactNode(alertNodeId, displayName, "alert", log);
        addEdge(avActor, alertNodeId, "Detection", "#ff0000", true);
        break;
      }

      case "FileCreated":
      case "FileModified":
      case "FileDeleted":
      case "FileRenamed":
      case "ShellLinkCreateFileEvent": {
        const folderPath = log.FolderPath || "";
        const fileName = log.FileName || "";
        const fullPath = folderPath ? (fileName ? folderPath + "\\" + fileName : folderPath) : fileName;

        if (actorId && fullPath) {
          getOrCreateProcessNode(actorId, actorName, username, evtType, log);
          let displayFile = fileName.length > 50 ? fileName.substring(0, 50) + "..." : fileName;
          if (!displayFile) {
            displayFile = fullPath.length > 50 ? fullPath.substring(0, 50) + "..." : fullPath;
          }
          addOrUpdateArtifactNode(fullPath, displayFile, "file", log);
          addEdge(actorId, fullPath, evtType, "#4da6ff", false);
        }
        break;
      }

      case "ImageLoaded":
      case "DriverLoad": {
        const dllPath = log.FolderPath || "";
        const dllName = log.FileName || "";

        if (actorId && dllPath) {
          const shortDll = dllName ? dllName : dllPath.includes('\\') ? dllPath.split('\\').pop() : dllPath;
          getOrCreateProcessNode(actorId, actorName, username, evtType, log);
          addOrUpdateArtifactNode(dllPath, shortDll, "module", log);
          addEdge(actorId, dllPath, "Loads Module", "#b366ff", false);
        }
        break;
      }

      case "RegistryKeyCreated":
      case "RegistryValueCreated":
      case "RegistryValueSet":
      case "RegistryKeyDeleted":
      case "RegistryValueDeleted": {
        const regKey = log.RegistryKey || log.PreviousRegistryKey || "";
        const regValue = log.RegistryValueName || log.PreviousRegistryValueName || "";

        if (actorId && regKey) {
          const regNodeId = regValue ? `${regKey}\\${regValue}` : regKey;
          const rawReg = regValue ? regValue : (regKey.includes('\\') ? regKey.split('\\').pop() : regKey);
          const displayReg = rawReg.length > 50 ? rawReg.substring(0, 50) + "..." : rawReg;

          getOrCreateProcessNode(actorId, actorName, username, evtType, log);
          addOrUpdateArtifactNode(regNodeId, displayReg, "registry", log);
          addEdge(actorId, regNodeId, evtType, "#ff9933", false);
        }
        break;
      }

      case "ConnectionSuccess":
      case "ConnectionFailed":
      case "NetworkConnectionEvents":
      case "NetworkCommunicationEvents":
      case "ListeningPortCreated":
      case "ListeningConnectionCreated":
      case "InboundConnectionAccepted":
      case "RemoteDesktopConnection":
      case "HttpConnectionInspected":
      case "ConnectionAcknowledged": {
        const remoteIp = log.RemoteIP || "";
        const remotePort = log.RemotePort || "";
        const localIp = log.LocalIP || "";
        const localPort = log.LocalPort || "";

        const addFields = getAdditionalFieldsDict(log);
        const remoteUrl = log.RemoteUrl || addFields.host || addFields.uri || "";

        let targetNet = remoteIp ? remoteIp : remoteUrl;
        if (!targetNet && localIp) {
          targetNet = (evtType === "ListeningPortCreated" || evtType === "ListeningConnectionCreated") ? `Local_Listen:${localIp}` : `Local:${localIp}`;
        }

        const targetPort = remotePort ? remotePort : localPort;
        const netActor = actorId ? actorId : "SYSTEM_NETWORK";
        const netActorName = actorName ? actorName : "Network Subsystem";

        if (targetNet) {
          const netNodeId = targetPort ? `${targetNet}:${targetPort}` : targetNet;
          getOrCreateProcessNode(netActor, netActorName, username, evtType, log);
          addOrUpdateArtifactNode(netNodeId, netNodeId, "network", log);
          addEdge(netActor, netNodeId, evtType, "#00ffff", false);
        }
        break;
      }

      default: {
        if (actorId && targetId && String(actorId) !== String(targetId)) {
          getOrCreateProcessNode(actorId, actorName, username, evtType, log);
          getOrCreateProcessNode(targetId, targetName, username, evtType, log);
          addEdge(actorId, targetId, evtType, "#a6a6a6", false);
        } else if (actorId) {
          getOrCreateProcessNode(actorId, actorName, username, evtType, log);
        }
        break;
      }
    }
  });

  return {
    elements: [
      ...Object.values(nodes),
      ...Object.values(edges)
    ]
  };
};
