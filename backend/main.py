from fastapi import FastAPI, HTTPException, Body
from models import TimeEntry
from database import time_entries_table
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from botocore.exceptions import ClientError
from typing import Optional

class ManualTimeEntry(BaseModel):
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: Optional[float] = None
    timezone: Optional[str] = None
    comment: Optional[str] = None

@app.post("/manual-entry", response_model=TimeEntry)
def manual_entry(entry: ManualTimeEntry):
    # Calculate duration if not provided and end_time is present
    duration = entry.duration
    if duration is None and entry.end_time:
        duration = (entry.end_time - entry.start_time).total_seconds()
    new_entry = {
        "id": str(uuid.uuid4()),
        "start_time": entry.start_time.isoformat(),
        "end_time": entry.end_time.isoformat() if entry.end_time else None,
        "duration": duration,
        "timezone": entry.timezone,
        "comment": entry.comment
    }
    # Filter out None values before insertion
    new_entry_cleaned = {k: v for k, v in new_entry.items() if v is not None}
    time_entries_table.put_item(Item=new_entry_cleaned)
    return new_entry_cleaned
from fastapi import FastAPI, HTTPException, Body
from models import TimeEntry
from database import time_entries_table
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from botocore.exceptions import ClientError
from typing import Optional

app = FastAPI()

@app.post("/clock", response_model=TimeEntry)
def clock(comment: Optional[str] = Body(None), tz: Optional[str] = Body(None)):
    # Check for an existing open time entry
    response = time_entries_table.scan()
    open_entries = [item for item in response.get('Items', []) if 'end_time' not in item]

    if open_entries:
        # Clock out
        entry = open_entries[0]
        end_time = datetime.now(timezone.utc)
        start_time = datetime.fromisoformat(entry['start_time'].replace('Z', '+00:00'))
        duration_seconds = (end_time - start_time).total_seconds()
        
        update_expression = "set #e = :e, #d = :d"
        expression_attribute_names = {'#e': 'end_time', '#d': 'duration'}
        expression_attribute_values = {
            ':e': end_time.isoformat().replace('+00:00', 'Z'),
            ':d': Decimal(str(duration_seconds))
        }
        if comment is not None:
            update_expression += ", #c = :c"
            expression_attribute_names['#c'] = 'comment'
            expression_attribute_values[':c'] = comment

        try:
            time_entries_table.update_item(
                Key={'id': entry['id']},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues="ALL_NEW"
            )
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"DynamoDB update failed: {e.response['Error'].get('Message', str(e))}")
        
        entry['end_time'] = end_time.isoformat().replace('+00:00', 'Z')
        entry['duration'] = duration_seconds
        if comment is not None:
            entry['comment'] = comment
        return entry
    else:
        # Clock in
        new_entry = {
            "id": str(uuid.uuid4()),
            "start_time": datetime.now(timezone.utc).isoformat(),
            "timezone": tz,
            "comment": comment
        }
        # Filter out None values before insertion
        new_entry_cleaned = {k: v for k, v in new_entry.items() if v is not None}
        time_entries_table.put_item(Item=new_entry_cleaned)
        return new_entry_cleaned

@app.get("/entries", response_model=list[TimeEntry])
def get_entries():
    response = time_entries_table.scan()
    return response.get('Items', [])

@app.patch("/entries/{entry_id}", response_model=TimeEntry)
def update_entry(entry_id: str, comment: str = Body(..., embed=True)):
    try:
        response = time_entries_table.update_item(
            Key={'id': entry_id},
            UpdateExpression="set #c = :c",
            ExpressionAttributeNames={'#c': 'comment'},
            ExpressionAttributeValues={':c': comment},
            ReturnValues="ALL_NEW"
        )
        return response['Attributes']
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            raise HTTPException(status_code=404, detail="Entry not found")
        raise HTTPException(status_code=500, detail=f"DynamoDB update failed: {e.response['Error'].get('Message', str(e))}")

@app.delete("/entries/{entry_id}", status_code=204)
def delete_entry(entry_id: str):
    try:
        time_entries_table.delete_item(
            Key={'id': entry_id},
            ConditionExpression="attribute_exists(id)"
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            raise HTTPException(status_code=404, detail="Entry not found")
        raise HTTPException(status_code=500, detail=f"DynamoDB delete failed: {e.response['Error'].get('Message', str(e))}")
    return

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8001)
