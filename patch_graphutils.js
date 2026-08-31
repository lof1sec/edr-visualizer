const fs = require('fs');

const path = 'frontend/src/utils/graphUtils.js';
let content = fs.readFileSync(path, 'utf8');

const crowdstrikeLogic = `
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
        const imageFile = log.ImageFileName ? log.ImageFileName.split('\\\\').pop() : "Unknown Process";

        if (parentId && targetId) {
          getOrCreateProcessNode(parentId, parentName, null, evtType, log);
          getOrCreateProcessNode(targetId, imageFile, username, evtType, log);

          addEdge(parentId, targetId, "Spawns", "#ff4d4d", false);

          if (sourceId && sourceId !== parentId) {
            getOrCreateProcessNode(sourceId, null, null, evtType, log);
            addEdge(sourceId, targetId, "True Source", "#ff33cc", true);
          }

          if (cmdline && cmdline !== "No CommandLine") {
            const cmdNodeId = \`cmd_\${targetId}\`;
            const wrappedCmd = cmdline.match(/.{1,60}/g)?.join('\\n') || cmdline;
            addOrUpdateArtifactNode(cmdNodeId, wrappedCmd, "commandline", log);
            addEdge(targetId, cmdNodeId, "Args", "#ffcc00", true);
          }
        }
      } else if (evtType === "ProcessAncestryInformation") {
        const baseFile = log.BaseFileName ? log.BaseFileName.split('\\\\').pop() : "";
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
          const alertNodeId = \`alert_\${actorId}_\${log.timestamp}\`;
          const displayLabel = \`ALERT: \${detectName}\\nSeverity: \${severity}\`;

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
          const logonNodeId = \`logon_\${actorId}_\${log.timestamp}\`;
          const displayLabel = \`Session: \${evtType}\\nType: \${logonType}\\n\${domain}\\\\\${userLogon}\`;
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
          const cleanPath = fileName.replace(/\\\\/g, '/');
          const shortName = cleanPath.replace(/\\/$/, '').split('/').pop();
          const displayFile = shortName.length > 50 ? shortName.substring(0, 50) + "..." : shortName;
          const safeFileId = \`file_\${hashStr(fileName)}\`;
          addOrUpdateArtifactNode(safeFileId, displayFile, "file", log);
          addEdge(contextId, safeFileId, evtType, "#4da6ff", false);
        }
      } else if (evtType === "ExecutableDeleted") {
        const fileName = log.TargetFileName || log.FileName || "";
        const actorId = contextId || sourceId;
        if (actorId && fileName) {
          getOrCreateProcessNode(actorId, contextName, username, evtType, log);
          const cleanPath = fileName.replace(/\\\\/g, '/');
          const shortName = cleanPath.replace(/\\/$/, '').split('/').pop();
          const displayFile = shortName.length > 50 ? shortName.substring(0, 50) + "..." : shortName;
          const safeFileId = \`file_\${hashStr(fileName)}\`;
          addOrUpdateArtifactNode(safeFileId, displayFile, "file", log);
          addEdge(actorId, safeFileId, "Deletes File", "#ff6666", true);
        }
      } else if (evtType === "SuspiciousCreateSymbolicLink") {
        const actorId = contextId || sourceId;
        if (actorId) {
          getOrCreateProcessNode(actorId, contextName, username, evtType, log);
          const symlink = log.SymbolicLinkName || "";
          const symNodeId = \`sym_\${hashStr(symlink)}\`;
          let displayLabel = symlink.replace(/\\\\/g, '/').split('/').pop();
          displayLabel = displayLabel.length > 50 ? displayLabel.substring(0, 50) + "..." : displayLabel;
          addOrUpdateArtifactNode(symNodeId, \`SymLink:\\n\${displayLabel}\`, "alert", log);
          addEdge(actorId, symNodeId, "Creates SymLink", "#ff0000", true);
        }
      } else if (["ScheduledTaskModified", "FirewallSetRule", "FirewallDeleteRule"].includes(evtType)) {
        const actorId = log.RpcClientProcessId || contextId || sourceId;
        if (actorId) {
          getOrCreateProcessNode(actorId, contextName, username, evtType, log);
          if (evtType === "ScheduledTaskModified") {
            const taskName = log.TaskName || "Unknown_Task";
            const nodeId = \`task_\${hashStr(taskName)}\`;
            const displayLabel = \`Task:\\n\${taskName.replace(/\\\\/g, '/').split('/').pop()}\`;
            addOrUpdateArtifactNode(nodeId, displayLabel, "commandline", log);
            addEdge(actorId, nodeId, "Modifies Task", "#ff9933", false);
          } else {
            const ruleId = log.FirewallRuleId || "Unknown_Rule";
            const nodeId = \`fw_\${hashStr(ruleId)}\`;
            const displayLabel = \`FW Rule:\\n\${ruleId.substring(0, 30)}\`;
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
          const shortDriver = driverPath.split('\\\\').pop();
          getOrCreateProcessNode(actorId, contextName, username, evtType, log);
          addOrUpdateArtifactNode(driverPath, shortDriver, "module", log);
          addEdge(actorId, driverPath, "Loads Driver", "#b366ff", false);
        }
      } else if (["AsepValueUpdate", "RegKeyCommit", "RegValueCommit", "RegSystemConfigValueUpdate"].includes(evtType)) {
        const regKey = log.RegObjectName || "";
        const regValue = log.RegValueName || "";
        const actorId = contextId || sourceId;
        if (actorId && regKey) {
          const regNodeId = regValue ? \`\${regKey}\\\\\${regValue}\` : regKey;
          const rawReg = regValue ? regValue : regKey.split('\\\\').pop();
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
            const dnsNodeId = \`dns_\${domain}\`;
            addOrUpdateArtifactNode(dnsNodeId, domain, "network", log);
            addEdge(actorId, dnsNodeId, "DNS Query", "#00ffff", false);
          } else {
            const remotePort = log.RemotePort || "";
            const netNodeId = \`\${remoteIp}:\${remotePort}\`;
            addOrUpdateArtifactNode(netNodeId, netNodeId, "network", log);
            addEdge(actorId, netNodeId, evtType, "#00ffff", false);
          }
        }
      } else if (["NeighborListIP4", "LFODownloadConfirmation", "ModuleCertificateInfo2", "UserLogoff"].includes(evtType)) {
        const hostNodeId = \`host_\${log.ComputerName || 'UnknownHost'}\`;
        addOrUpdateArtifactNode(hostNodeId, \`Host:\\n\${log.ComputerName || 'Unknown'}\`, "network", log);
        const nodeHash = hashStr(String(log.timestamp || Date.now()));
        const nodeId = \`floating_\${evtType}_\${nodeHash}\`;

        if (evtType === "NeighborListIP4") {
          addOrUpdateArtifactNode(nodeId, "ARP Neighbor List", "network", log);
          addEdge(hostNodeId, nodeId, "Network Intel", "#00ffff", true);
        } else if (evtType === "LFODownloadConfirmation") {
          const fileName = log.TargetFileName || "";
          addOrUpdateArtifactNode(nodeId, \`LFO Download:\\n\${fileName}\`, "file", log);
          addEdge(hostNodeId, nodeId, "Service Download", "#4da6ff", true);
        } else if (evtType === "ModuleCertificateInfo2") {
          const sha256 = log.SHA256HashData || "";
          addOrUpdateArtifactNode(nodeId, \`Cert Info\\n\${sha256.substring(0, 8)}...\`, "module", log);
          addEdge(hostNodeId, nodeId, "Cert Telemetry", "#b366ff", true);
        } else if (evtType === "UserLogoff") {
          const authId = log.AuthenticationId || "";
          addOrUpdateArtifactNode(nodeId, \`Session End\\nID: \${authId}\`, "commandline", log);
          addEdge(hostNodeId, nodeId, "Logoff", "#a6a6a6", true);
        }
      } else if (evtType === "CommandHistory") {
        const cmdHistory = log.CommandHistory || "";
        const actorId = targetId || contextId;
        if (actorId && cmdHistory) {
          getOrCreateProcessNode(actorId, null, username, evtType, log);
          const cmdNodeId = \`cmdhist_\${actorId}_\${hashStr(cmdHistory)}\`;
          const wrappedCmd = cmdHistory.match(/.{1,60}/g)?.join('\\n') || cmdHistory;
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
`;

const lines = content.split('\n');
const startIdx = lines.findIndex(line => line.includes('// Generic CS mapping to MDE logic'));
const endIdx = lines.findIndex(line => line.includes('// MDE Logic matches Jupiter Notebook'));

if (startIdx !== -1 && endIdx !== -1) {
    const before = lines.slice(0, startIdx).join('\n');
    const after = lines.slice(endIdx).join('\n');
    fs.writeFileSync(path, before + '\n' + crowdstrikeLogic + '\n' + after);
    console.log("Patched successfully!");
} else {
    console.log("Could not find patch points.");
}
