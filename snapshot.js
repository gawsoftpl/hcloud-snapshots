#!/usr/bin/node

const { axiosInstance } = require('./axios.instance')
const { waitForAction } = require('./actions')
const {convertServerLabels} = require("./utils");

const project_prefix = process.env.PROJECT_PREFIX

if (!project_prefix) {
    console.error("No set env PROJECT_PREFIX")
    process.exit(1)
}

const do_not_delete = process.env.NO_DELETE_SERVER

async function createSnapshot(server) {
    try {
        // Check if snapshot exists
        const response = await axiosInstance.get('/images', {
            params: { label_selector: `name=${server.name}` }
        });
        
        // If exists, delete it
        if (response?.data?.images) {
            for (const image of response.data.images) {
                await axiosInstance.delete(`/images/${image.id}`);
            }
        }

        // Shutdown the server
        const shutdownResponse = await axiosInstance.post(`/servers/${server.id}/actions/shutdown`);
        await waitForAction(shutdownResponse?.data?.action?.id, 'servers')

        if (shutdownResponse.status !== 201) {
            const powerOffResponse = await axiosInstance.post(`/servers/${server.id}/actions/poweroff`);
            await waitForAction(powerOffResponse?.data?.action?.id, 'servers')
        }

        // Create snapshot
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' }
        const date = new Date().toLocaleDateString('en-US', dateOptions)

        const responseCreateImage = await axiosInstance.post(`/servers/${server.id}/actions/create_image`,{
            description: `${server.name}-${date}`,
            type: "snapshot",
            labels: {
                name: server.name,
                project: project_prefix,
                auto_snapshot: "true",
                private_net: server.private_net.map(private_net => private_net.network).join(';'),
                private_ips: server.private_net.map(private_net => private_net.ip).join(';'),
                instance_type: server.server_type.name,
                location: server.datacenter.location.name,
                ...convertServerLabels(server.labels)
            }
        });

        if (responseCreateImage.status == 201){
            const snapshotCreateResponse = await waitForAction(responseCreateImage?.data?.action?.id, 'images')
            if (snapshotCreateResponse) {
                if (do_not_delete) return true;
                const deleteInstance = await axiosInstance.delete(`/servers/${server.id}`)
                return await waitForAction(deleteInstance?.data?.action?.id, 'servers')
            }
        }


    } catch (error) {
        console.log("ERROR")
        console.error('Error creating snapshot:', error.response ? JSON.stringify(error.response.data) : error.message);
    }

    return false;
}

async function getServers(projectPrefix = "") {
    try {
        const response = await axiosInstance.get('/servers', {
            params: { per_page: 50 }
        });

        return response.data.servers.filter(server => server.name.startsWith(projectPrefix));
    } catch (error) {
        console.error('Error fetching servers:', error.response ? error.response.data : error.message);
        return [];
    }
}

(async () => {
    const servers = await getServers(project_prefix);
    const jobs = servers.map(server => createSnapshot(server))
    const response = await Promise.all(jobs)
    if (response.every(response => response)) {
        console.log("Create snapshots for all instances")
        process.exit(0)
    }else{
        console.error("Error with create snapshots", response)
        process.exit(1)
    }
})();
