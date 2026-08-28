# EDR Visualizer

A web application designed to visualize and analyze Endpoint Detection and Response (EDR) events in a node/edge graph style. This tool currently supports logs from:
- **CrowdStrike Falcon** (JSONL format)
- **Defender XDR** (CSV format - automatically converted to JSONL internally)

## Features
- **Graph Visualization:** Built with Cytoscape.js for high-performance rendering of process trees (PID -> Parent PID).
- **Rich Event Inspection:** Click on any node to view all detailed events and properties associated with that process.
- **Search & Filtering:** Search for strings, numerical values, or IPs. The graph will isolate and show only the matching nodes and their related edges.
- **Workspace Persistence:** Save the exact position of nodes and the current search query so you can resume analysis later.
- **Night Mode:** Toggle between light and dark themes.

## Prerequisites
- [Node.js](https://nodejs.org/en/) (v16 or newer recommended)

## Installation & Setup

1. **Clone the repository** (if you haven't already).
2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```
3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

## Running the Application

You need to run both the backend server and the frontend development server simultaneously.

**Step 1: Start the Backend Server**
Open a terminal, navigate to the `backend` directory, and run:
```bash
cd backend
node server.js
```
The backend server will start on `http://localhost:3001`. It handles file uploads, conversion of CSV to JSONL, and saving workspaces.

**Step 2: Start the Frontend Server**
Open a *new* terminal window, navigate to the `frontend` directory, and run:
```bash
cd frontend
npm run dev
```
The frontend application will typically start on `http://localhost:5173`. Open this URL in your web browser.

## Usage Guide
1. Select the **Log Type** (Defender XDR or CrowdStrike Falcon) from the sidebar dropdown.
2. Click **Select File** and upload your `.csv` or `.jsonl` file.
3. Once uploaded and converted (if Defender), the file will appear under "Available Logs".
4. Click the file to render the process graph.
5. Zoom, drag nodes, and use the top search bar to filter for specific activities.
6. Click **Save Workspace** to remember your custom layout.