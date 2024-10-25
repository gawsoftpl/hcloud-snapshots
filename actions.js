const { axiosInstance } = require('./axios.instance')

async function getAction(id, typeName) {
    try{
        if (!id) throw new Error("No set action id")

        const response = await axiosInstance.get(`/${typeName}/actions/${id}`);
        if (response.status == 200) {
            return response.data.action
        }
    }catch(err){
        console.error(err?.message)
    }

    return null
}

async function checkServerIsPowerOff(id) {
    const response = await axiosInstance.get(`/servers/${id}`)
    return response?.data?.server?.status == 'off'
}

async function waitForShutdown(id)
{
    return new Promise((resolve) => {
        let index=0;
        const close = () => {
            if (interval) clearInterval(interval)
        }

        const interval = setInterval(async() => {
            try{
                console.log(`Waiting for shutdown server ${id}`)
                index++
                if (await checkServerIsPowerOff(id)){
                    resolve(true)
                    close()
                }
                if (index > 30){
                    close()
                    console.error(`Waiting for shutdown server ${id} timeout`)
                    resolve(false)
                }
            }catch(err){
                close()
                resolve(false)
            }
        }, 5000)
    })
}

async function waitForAction(id, typeName) {
    return new Promise((resolve, reject) => {
        let interval;
        let index = 0;
        try{
            const check = async() => {
                index++;
                const response = await getAction(id, typeName)

                if (response) {
                    if (response.status == 'success') {
                        resolve(true)
                        clearInterval(interval)
                    } else if (response.status == 'error') {
                        reject(new Error(response?.error?.message))
                        clearInterval(interval)
                    }else{
                        if (index % 2 == 0) {
                            console.log(`Progress of action ${typeName}: ${id}: ${response.progress}%`)
                        }
                    }

                }
            }

            interval = setInterval(check, 5000)
            check()

        }catch(err){
            reject(err)
        }
    })
}

module.exports = {
    getAction,
    waitForShutdown,
    waitForAction
}