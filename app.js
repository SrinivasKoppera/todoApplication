const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const databasePath = path.join(__dirname, "todoApplication.db");
let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
// Status and Priority Search Function
const hasStatusAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

//1.1 GET Details of who's status = TO DO API
app.get("/todos", async (request, response) => {
  let dbResponse = null;
  let getTodoQuery = "";
  const { search_q = "", status, priority } = request.query;
  switch (true) {
    case hasStatusAndPriorityProperties(request.query):
      getTodoQuery = `
            SELECT 
                *
            FROM 
                todo
            WHERE 
                todo LIKE '%${search_q}%'
                AND status = '${status}' 
                AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}';`;
      break;
    default:
      getTodoQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%';`;
      break;
  }
  dbResponse = await database.all(getTodoQuery);
  response.send(dbResponse);
});

//2.GET Specific Todo Based On the Id API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodoQuery = `
    SELECT 
        *
    FROM 
        todo
    WHERE
        id = ${todoId};`;
  const singleTodo = await database.get(getSpecificTodoQuery);
  response.send(singleTodo);
});

//3.Create A New Todo API
app.post("/todos/", async (request, response) => {
  const newTodoDetails = request.body;
  const { id, todo, priority, status } = newTodoDetails;
  const addNewTodoQuery = `
    INSERT INTO
        todo(id, todo, priority, status)
    VALUES
        (${id}, '${todo}', '${priority}', '${status}');`;
  const newTodoStatus = await database.run(addNewTodoQuery);
  response.send("Todo Successfully Added");
});

//4.UPDATE Todo API
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedStatus = null;
  switch (true) {
    case request.body.todo !== undefined:
      updatedStatus = "Todo";
      break;
    case request.body.priority !== undefined:
      updatedStatus = "Priority";
      break;
    case request.body.status !== undefined:
      updatedStatus = "Status";
      break;
  }
  const getPreviousDataQuery = `
    SELECT
        *
    FROM
        todo
    WHERE
        id = ${todoId};`;
  let previousData = await database.get(getPreviousDataQuery);
  //   console.log(previousData);
  const {
    todo = previousData.todo,
    priority = previousData.priority,
    status = previousData.status,
  } = request.body;
  const updateQuery = `
    UPDATE 
        todo
    SET
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}'
    WHERE 
        id = ${todoId};`;
  await database.run(updateQuery);
  //   console.log(updateQuery);
  response.send(`${updatedStatus} Updated`);
});
//5.DELETE todo API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
        todo
    WHERE
        id = ${todoId};`;
  const deleteResponse = await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
