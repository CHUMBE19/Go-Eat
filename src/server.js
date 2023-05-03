import Configuration from "./config"

const conf = Configuration.getConfiguration();

let headers = { "Content-Type":"application/json;charset=utf-8"};
const ServerConnection = ( ()=>{

     const serialize=(obj)=>{
        var str = [];
        for (var p in obj)
          if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
          }
        return str.join("&");
    }

    const httpPostPromise=(url, payload)=>{
        headers.Authorization='Bearer '+sessionStorage.getItem("token");
        return new Promise((result,reject)=>{
            fetch(url,{method:'POST',headers,body:JSON.stringify(payload)})
            .then(r=>r.json())
            .then(r=> result(r))
            .catch(e=> reject(e))
        })
    }
    const httpGetPromise=(url, payload)=>{
        headers.Authorization='Bearer '+sessionStorage.getItem("token");

        return new Promise((result,reject)=>{
            let params=serialize(payload)
            fetch(`${url}?${params}`,{method:'GET',headers})
            .then(r=>r.json())
            .then(r=> result(r))
            .catch(e=> reject(e))
        })
    }
    const getproductos = (params)=>{
       return httpGetPromise(`${conf.API}/businessobject/list`, params);
    }

    const saveUser=(payload)=>{
        return httpPostPromise(`${conf.API}/user/oauth2/save`, payload);
    }

    return {getproductos,saveUser}
} ) ()

export default ServerConnection