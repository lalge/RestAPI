import {Subject} from "rxjs";

var eventServiceSubject = new Subject();

function register(next,err,complete)
{
    eventServiceSubject.subscribe(
        next, err,complete
    )
}

function send(message)
{
    eventServiceSubject.next(message);   
}

const eventService = 
{
    register : register,
    send : send
};

export default eventService;