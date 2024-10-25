#!/usr/bin/node

const { axiosInstance } = require('./axios.instance')
const { waitForAction } = require('./actions')
const {decodeServerLabels} = require("./utils");

// Variables
const project_prefix = process.env.PROJECT_PREFIX

if (!project_prefix) {
    console.error("No set env PROJECT_PREFIX")
    process.exit(1)
}

// Use force networks eq: 11111-22222, will attach to both network
const networks_force = process.env.NETWORKS_FORCE

const ssh_key_name = process.env.SSH_KEY_NAME

if (!ssh_key_name) {
    console.error("No set env SSH_KEY_NAME")
    process.exit(1)
}

async function attachServerToNetwork(server_id, network_id, private_ip){

    const attachToPrivateNetworkResponse = await axiosInstance.post(`/servers/${server_id}/actions/attach_to_network`, {
        network: parseInt(network_id),
        ip: private_ip,
        alias_ips: [],
    })
    return await waitForAction(attachToPrivateNetworkResponse?.data?.action?.id, 'networks')
}

async function powerOnServer(id) {
    const powerOnServerResponse = await axiosInstance.post(`/servers/${id}/actions/poweron`)
    return await waitForAction(powerOnServerResponse?.data?.action?.id, 'servers')
}

// Methods
async function createServer(image) {
    try{
        let networks = networks_force ? networks_force.split('-') : image.labels.private_net.split('-')
        let private_ips = image.labels.private_ips.split('-')
        const volumes = image.labels?.volumes?.split('-') ?? []

        const response = await axiosInstance.post('/servers', {
            image: image.id,
            automount: volumes.length > 0,
            volumes: volumes,
            name: image.labels.name,
            start_after_create: false,
            labels: decodeServerLabels(image.labels),
            location: image.labels.location,
            server_type: image.labels.instance_type,
            ssh_keys: [
                ssh_key_name
            ]
        });
        if (response.status == 201){
            console.log(`Creating server ${image.labels.name} id: ${response?.data?.action?.id}`);
            const serverCreated = await waitForAction(response?.data?.action?.id, 'servers')
            if (serverCreated) {
                // attach to private network with static ip
                await Promise.all(networks.map((network_id, index) => {
                    return attachServerToNetwork(response.data.server.id, network_id, private_ips[index])
                }))
                return await powerOnServer(response.data.server.id)

            }
        }
    }catch(err){
        console.error(err?.message)
        console.error(JSON.stringify(err?.response?.data))
    }

    return false
}

async function getImages() {
    try {
        const response = await axiosInstance.get('/images', {
            params: {
                per_page: 50,
                label_selector: `project=${project_prefix}`
            }
        });

        return response.data.images
    } catch (error) {
        console.log(error.response)
        console.error('Error fetching servers:', error.response ? JSON.stringify(error.response.data) : error.message);
        return [];
    }
}

(async () => {
    const images = await getImages();
    if (!images?.length) {
        console.error("Cant find images to restore")
        process.exit(1)
    }

    const jobs = images.map(image => createServer(image))
    const response = await Promise.all(jobs)
    if (response.every(response => response)) {
        console.log("Restore servers from snapshots completed")
        process.exit(0)
    }else{
        console.error("Error with create server", response)
        process.exit(1)
    }
})();
