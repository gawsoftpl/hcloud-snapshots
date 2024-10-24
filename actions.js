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
    waitForAction
}