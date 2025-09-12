import pydot

import re

import time

import threading

from collections import deque

from flask import Flask, send_file

from pymongo import MongoClient

 
app = Flask(__name__)
 
# Function to process the log data

def process_log_data_from_db():
    node_parent_map = {}
    edge_labels = {}
    recent_nodes = set()

    try:
        # Connect to MongoDB (adjust URI, DB name, collection name)
        client = MongoClient("mongodb+srv://vikash:vikash@cluster0.r8xnzcr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
        db = client["test"]                # database name
        collection = db["devices"]        # collection name

        # Fetch all documents (you can add filters if needed)
        docs = list(collection.find())

        # Fill maps
        for doc in docs:
            device = doc.get("device")
            parent = doc.get("parent")
            rsl_out = doc.get("rsl_out")

            if device and parent:
                node_parent_map[device] = parent
                edge_labels[device] = f"{rsl_out} dBm" if rsl_out is not None else ""

        # Define "recent" nodes (last N entries, similar to deque logic)
        recent_docs = docs[-50:]   # last 50 entries
        for doc in recent_docs:
            if "device" in doc:
                recent_nodes.add(doc["device"])

    except Exception as e:
        print(f"MongoDB read error: {e}")

    return node_parent_map, edge_labels, recent_nodes

# Function to generate the SVG from the node-parent map

def generate_svg(node_parent_map, edge_labels, recent_nodes):

    # Count total connected nodes

    total_nodes_connected = len(node_parent_map)
    
    # Count only green-colored nodes (those in recent_nodes)    
    green_nodes_connected = sum(1 for node in node_parent_map if node in recent_nodes)

    dot_graph = f"""

    digraph wisun_network {{

        rankdir=TB;  // Top to Bottom layout
 
        node [shape=circle style=filled fixedsize=true width=0.7 height=0.7 fontsize=15 fillcolor=lightgreen fontcolor=black]
 
        // Title node as a label, with no shape, positioned 5 cm above ab48

        "title" [label="Wi-SUN Network Node Tree" shape=plaintext fontsize=5 width=0 height=0]
 
        // ab48 node, enlarged and includes total nodes in the second line

        "ab48" [label="Connected\nnodes: {green_nodes_connected}" color=black style=filled fillcolor="#FF2C2C" fontcolor=Black fontsize=15   width=1 height=1]    #fontname="Helvetica-Bold"
 
        // Add padding around the graph to ensure the title is not cut off

        graph [pad="0.5,0.5"]

    """
 
    # Add edges dynamically based on the final node-parent map

    for device, parent in node_parent_map.items():

        rsl_out_label = edge_labels.get(device, "")

        fillcolor = "lightgreen" if device in recent_nodes else "grey"
 
        dot_graph += f'  "{device}" [fillcolor="{fillcolor}"]\n'

        dot_graph += f'  "{parent}" -> "{device}" [label="{rsl_out_label}" fontsize=9]\n'
 
    # Link the title node to ab48 for layout purposes (invisible)

    dot_graph += '  "title" -> "ab48" [style=invis]\n'
 
    dot_graph += "}"
 
    # Generate and save the SVG

    (graph,) = pydot.graph_from_dot_data(dot_graph)

    graph.write_svg("/home/ubuntu/Wisun-Srv/wisun_network.svg")

    print("SVG file written successfully.")

 

 

 
 
# Background thread to repeatedly process the log data and generate the SVG

def update_graph_periodically():

    while True:

        process_and_generate_graph()

        time.sleep(5)  # Update every 5 seconds
 
# Function to process the file and generate the graph

def process_and_generate_graph():

    node_parent_map, edge_labels, recent_nodes = process_log_data_from_db()

    generate_svg(node_parent_map, edge_labels, recent_nodes)
 
# Route to serve the SVG file

@app.route('/svg')

def serve_svg():

    return send_file('/home/ubuntu/Wisun-Srv/wisun_network.svg', mimetype='image/svg+xml')
 
# Route to serve the HTML page that displays the SVG

@app.route('/')

def index():

    return '''
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Wi-SUN Network Graph</title>
<style>

    body, html {

        height: 100%;

        margin: 0;

        background-color: white;

        display: flex;

        justify-content: center;

        align-items: flex-start;

    }

    .container {

        display: flex;

        justify-content: center;

        align-items: center;

        width: 100%;

        margin-top: 5cm;

    }

    #graph-svg {

        max-width: 100%;

        max-height: calc(100% - 5cm);

        margin: auto;

        display: block;

    }
</style>
</head>
<body>
<div class="container">
<img src="/svg" id="graph-svg" alt="Wi-SUN Network Graph">
</div>
<script>

        setInterval(() => {

            document.getElementById("graph-svg").src = "/svg?" + new Date().getTime();

        }, 5000);
</script>
</body>
</html>

    '''
 
if __name__ == '__main__':

    threading.Thread(target=update_graph_periodically, daemon=True).start()

    app.run(host='0.0.0.0', port=80)