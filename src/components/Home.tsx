import { useEffect } from "react";
import { RestBuilder } from "../utils/RestBuilder";

function Home() {

    useEffect(() => {

        RestBuilder.setEndpoint('schedules/', 'GET')
            .request()
            .then(result => {
                console.log(result)
            })
    });
    

    return <h1>Home</h1>;
}

export default Home