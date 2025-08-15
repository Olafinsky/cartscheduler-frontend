import { useParams } from "react-router-dom";
import { AuthService } from "../utils/AuthService";
import { useEffect } from "react";

function Login() {

    let { token } = useParams();

    useEffect(() => {
        AuthService.storeInvitationToken(token ?? '');
        AuthService.login();
    });
    

    return <>
    Params: {token}
    </>;
}

export default Login