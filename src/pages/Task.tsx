import React, { useEffect, useState } from 'react';
import { completeTask } from '../util/test';

export default function Task(task: any) {
    const [taskState, setTaskState] = useState(task.completed);

    return (
        <div onClick={async () => { completeTask(task.name, setTaskState) }}>
            <div className='taskContainer'>
                <input
                    className='taskCheckbox'
                    type="checkbox"
                    id={task.name}
                    name={task.name}
                    checked={taskState}
                />
                <li key={task.name} style={{ textDecoration: taskState ? "line-through" : "none" }}>
                    {task.name}
                </li>
            </div>
            <hr style={{ width: "90%" }} />
        </div>
    );
}