const Configuration = ( ()=>{
    const local = {
        API:"http://localhost:8086/api",
    }
    const dev = {
        API:"http://localhost:8086/api",
    }

    const prod = {
        API: "",
    }

    const configMap = new Map()
    configMap.set("local",local)
    configMap.set("prod",prod)
    configMap.set("dev",dev)

    const getEnv= ()=>{
        const host = window.location.toString();
        const env = /simba/.test(host)?"dev" : /localhost:8080/.test(host)?"local": "local"
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