import BaseModel from  "./baseModel";

class DataPoint extends BaseModel
{
    constructor(key="",value="")
    {
            super();
            
            this.key=key;
            this.value=value;

    }
}

export default DataPoint;