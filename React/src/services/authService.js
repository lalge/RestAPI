
const authRestEndpoint = "http://localhost:90/jwt";

function getAuthHeader()
{
    var token = sessionStorage.getItem("AUTH_TOKEN");

    var authHeader = 
    {
        Authorization : `Bearer ${token}`
    }

    return authHeader;
}

function isUserAuthentication()
{
    var isAuthenticated = false;

    var token = sessionStorage.getItem("AUTH_TOKEN");
    if(token !== null)
    {
        isAuthenticated = true;
    }

    return isAuthenticated;
}

function login(userModel)
{
    return new Promise(
        async function onThen(resolve,reject)
        {
            try
            {
                var response  = await window.fetch(authRestEndpoint)
                var signedInUser= await response.json();

                console.dir('signedInUser');
                console.dir(signedInUser);
                sessionStorage.setItem("AUTH_TOKEN",signedInUser.token);
                resolve(signedInUser);
            }
            catch(ex)
            {
                console.dir(ex);
                reject("sign in failed");
            }
        }
    );
}

const authService = 
{
    login : login,
    isUserAuthentication : isUserAuthentication,
    getAuthHeader : getAuthHeader
}

export default authService;