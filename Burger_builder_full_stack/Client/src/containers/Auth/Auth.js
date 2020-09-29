import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import Input from '../../components/UI/Input/Input';
import Button from '../../components/UI/Button/Button';
import Spinner from '../../components/UI/Spinner/Spinner';
import classes from './Auth.css';
import * as actions from '../../store/actions/index';
import { updateObject, checkValidity } from '../../share/utility';

class Auth extends Component {
    state = {
        controls: {
            email: {
                elementType: 'input',
                elementConfig: {
                    type: 'email',
                    placeholder: 'Mail Address'
                },
                value: '',
                validation: {
                    required: true,
                    isEmail: true
                },
                valid: false,
                touched: false
            },
            password: {
                elementType: 'input',
                elementConfig: {
                    type: 'password',
                    placeholder: 'Password'
                },
                value: '',
                validation: {
                    required: true,
                    minLength: 6
                },
                valid: false,
                touched: false
            },
            name: {
                elementType: 'input',
                elementConfig: {
                    type: 'name',
                    placeholder: 'name'
                },
                value: '',
                validation: {
                    required: true,
                    minLength: 2
                },
                valid: false,
                touched: false
            }
        },
        isSignup: true,
        disabled: true
    }

    componentDidMount() {
        if (!this.props.buildingBurger && this.props.authRedirectPath !== '/') {
            this.props.onSetAuthRedirectPath();
        }
    }

    inputChangedHandler = (event, controlName) => {
        const updatedControls = updateObject(this.state.controls, {
            [controlName]: updateObject(this.state.controls[controlName], {
                value: event.target.value,
                valid: checkValidity(event.target.value, this.state.controls[controlName].validation),
                touched: true
            })
        });
        let disabled = true;
        Object.entries(updatedControls).forEach(pair => {
            disabled = disabled && pair[1].valid
        })
        this.setState({ controls: updatedControls , disabled: !disabled});
    }

    submitHandler = (event) => {
        event.preventDefault();
        this.props.onAuth(
            this.state.controls.email.value, 
            this.state.controls.password.value, 
            this.state.controls.name ? this.state.controls.name.value : null, 
            this.state.isSignup);
    }

    switchAuthModeHandler = () => {
        this.setState(prevState => {
            if (prevState.isSignup) {
                const newState = { ...prevState };
                delete newState.controls.name;
                newState.isSignup = !prevState.isSignup;
                return newState;
            } else {
                const newState = { ...prevState };
                if (!newState.controls.name) {
                    newState.controls.name = {
                        elementType: 'input',
                        elementConfig: {
                            type: 'name',
                            placeholder: 'name'
                        },
                        value: '',
                        validation: {
                            required: true,
                            minLength: 2
                        },
                        valid: false,
                        touched: false
                    }
                }
                newState.isSignup = !prevState.isSignup;
                return newState;
            }
        });
    }

    render() {
        const formElementsArray = [];
        for (let key in this.state.controls) {
            formElementsArray.push({
                id: key,
                config: this.state.controls[key]
            });
        }

        let form = formElementsArray.map(formElement => (
            <Input
                key={formElement.id}
                elementType={formElement.config.elementType}
                elementConfig={formElement.config.elementConfig}
                value={formElement.config.value}
                invalid={!formElement.config.valid}
                shouldValidate={formElement.config.validation}
                touched={formElement.config.touched}
                changed={(event) => this.inputChangedHandler(event, formElement.id)} />
        ));

        if (this.props.loading) {
            form = <Spinner />
        }

        let errorMessage = null;
        if (this.props.error) {
            const message = this.props.error.message.replace(/_/g, ' ').toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase());
            errorMessage = (
                <p>{message}</p>
            );
        }

        let authRedirect = null;
        if (this.props.isAuthenticated) {
            authRedirect = <Redirect to={this.props.authRedirectPath} />
        }

        let switchBotton = <Button clicked={this.switchAuthModeHandler} btnType="Signup">SWITCH TO REGISTER</Button>
        if (this.state.isSignup) {
            switchBotton = <Button clicked={this.switchAuthModeHandler} btnType="Signin">SWITCH TO SIGNIN</Button>
        }

        return (
            <div className={classes.Auth}>
                {this.state.isSignup ? <h2 className={classes.Signup} >REGISTER</h2> : <h2 className={classes.Signin} >SIGNIN</h2>}
                {authRedirect}
                {errorMessage}
                <form onSubmit={this.submitHandler}>
                    {form}
                    <Button btnType="Success" disabled={this.state.disabled} >SUBMIT</Button>
                </form>
                {switchBotton}
            </div>
        );

    }
}

const mapStateToProps = state => {
    return {
        loading: state.auth.loading,
        error: state.auth.error,
        isAuthenticated: state.auth.token !== null,
        buildingBurger: state.burgerBuilder.building,
        authRedirectPath: state.auth.authRedirectPath
    };
};

const mapDispatchToProps = dispatch => {
    return {
        onAuth: (email, password, name, isSignup) => dispatch(actions.auth(email, password, name, isSignup)),
        onSetAuthRedirectPath: () => dispatch(actions.setAuthRedirectPath('/'))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Auth);