class BaseModel
{
    constructor()
    {
        
    }
    serialize()
    {
      return JSON.stringify(this);   
    }
}
export default BaseModel;