const { axiosInstance } = require('./axios.instance')
const { waitForAction } = require('./actions')
const {decodeServerLabels} = require("./utils");

// Variables
const project_prefix = process.env.PROJECT_PREFIX

if (!project_prefix) {
    console.error("No set env PROJECT_PREFIX")
    process.exit(1)
}

const network_force = process.env.NETWORK_FORCE

const ssh_key_name = process.env.SSH_KEY_NAME

if (!ssh_key_name) {
    console.error("No set env SSH_KEY_NAME")
    process.exit(1)
}

// Methods
async function createServer(image) {

    try{
        let networks = image.labels.private_net.split(';')
        if (network_force) networks = network_force.split(';')

        const response = await axiosInstance.post('/servers', {
            image: image.id,
            automount: true,
            networks: networks,
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
            return await waitForAction(response?.data?.action?.id, 'servers')
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
