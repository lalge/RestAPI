import React from "react";
import { connect } from "react-redux";
import { getLoginAction } from "../actions/authActions";

function mapStateToProps(state)
{
    return{};
}

function mapDispatchToProps(dispatch)
{
    return{
        handleOnLogin : function(userModel)
        {
            console.dir(userModel);
            dispatch(getLoginAction(userModel));
        }
    };
}

const LoginContainer = connect(mapStateToProps,mapDispatchToProps)(
    (props) => 
    {
        return(
            <LoginComponent onLogin={props.handleOnLogin}/>
        );
    }
);

function LoginComponent(props)
{
    const refs = 
    {
        username : React.createRef(),
        password : React.createRef()
    }
    
    function handleLogin()
    {
        const user = 
        {
            username : refs.username.current.value,
            password : refs.password.current.value
        }

        props.onLogin(user);
    }

    return(
        <>
            <h1>
                Login
            </h1>
            <div>
                <form>
                    <section>
                        <span>username</span>
                        <input type="text" name="text" ref={refs.username}/>
                    </section>
                    <section>
                        <span>password</span>
                        <input type="password" name="password" ref={refs.password}/>
                    </section>
                    <section>
                        <button type="button" onClick={handleLogin}>
                            Sign-In
                        </button>
                    </section>
                </form>
            </div>
        </>
    );
}

export default LoginContainer;