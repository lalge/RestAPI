import React from 'react';
import EventService from "../../services/eventService";

class Notification extends React.Component
{
  constructor(props)
  {
    super(props);
    
    this.state = 
    {
      notificationMessage : ""
    };

    EventService.register(
      (data) =>
      {
        this.setState(
          {
            notificationMessage : data,
          },
          () => 
          {
            setTimeout(
              () => 
              {
                this.setState(
                  {
                    notificationMessage : ""
                  }
                )
              },
              2000
            )
          }
        )
      },
      (error) => {},
      () => {}
    )
  }

  render()
  {
    return(<div className="app-notification">
      {
        this.state.notificationMessage
      }
    </div>
    )
  }   
}

Notification.defaultProps = {};

export default Notification;
