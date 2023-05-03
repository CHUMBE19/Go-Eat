const Configuration = ( ()=>{
    const local = {
        API:"https://goeat.azurewebsites.net/api",
    }
    const dev = {
        API:"http://localhost:8086/api",
    }

    const prod = {
        API: "https://goeat.azurewebsites.net/api",
    }

    const configMap = new Map()
    configMap.set("local",local)
    configMap.set("prod",prod)
    configMap.set("dev",dev)

    const getEnv= ()=>{
        const host = window.location.toString();
        const env = /simba/.test(host)?"dev" : /localhost:8080/.test(host)?"local": "prod"
        return env;
    }
    const getConfiguration = ()=>{
        const env = getEnv()
        const config = configMap.get(env)
        return config;
    }

    return {getConfiguration,getEnv}
}) ()

export default Configuration