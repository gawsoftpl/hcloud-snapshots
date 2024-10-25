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


const ssh_key_name = process.env.SSH_KEY_NAME

if (!ssh_key_name) {
    console.error("No set env SSH_KEY_NAME")
    process.exit(1)
}

async function attachServerToNetwork(server_id, network_id, private_ip){
    const attachToPrivateNetworkResponse = await axiosInstance.post(`/servers/${server_id}/actions/attach_to_network`, {
        network: network_id,
        ip: private_ip
    })
    return await waitForAction(attachToPrivateNetworkResponse?.data?.action?.id, 'servers')
}

async function powerOnServer(id) {
    const powerOnServerResponse = await axiosInstance.post(`/servers/${id}/actions/poweron`)
    return await waitForAction(powerOnServerResponse?.data?.action?.id, 'servers')
}

// Methods
async function createServer(image) {

    try{
        let networks = image.labels.private_net.split(';')
        let private_ips = image.label.private_ips.split(';')

        const response = await axiosInstance.post('/servers', {
            image: image.id,
            automount: true,
            name: image.labels.name,
            start_after_create: true,
            labels: decodeServerLabels(image.labels),
            location: image.labels.location,
            server_type: image.labels.instance_type,
            ssh_keys: [
                ssh_key_name
            ]
        });
        if (response.status == 201){
            console.log(`Creating server ${image.labels.name}`);
            const serverCreated = await waitForAction(response?.data?.action?.id, 'servers')
            if (serverCreated) {
                // attach to private network with static ip
                networks.map(async(network_id, index) => {
                    await attachServerToNetwork(serverCreated.data.server.id, network_id, private_ips[index])
                    return await powerOnServer(serverCreated.data.server.id)
                })
            }
        }
    }catch(err){
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
        console.error('Error fetching servers:', error.response ? JSON.stringify(error.response.data) : error.message);
        return [];
    }
}

(async () => {
    const images = await getImages();
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
