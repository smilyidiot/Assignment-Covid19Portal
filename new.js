const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityAndCategoryProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const convertJsonObj = (item) => {
  return {
    id: item.id,
    todo: item.todo,
    priority: item.priority,
    category: item.category,
    status: item.status,
    dueDate: item.due_date,
  };
};

//API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  getTodoQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    //Scenario 1
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
                    SELECT *
                    FROM todo
                    WHERE
                    status = '${status}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((element) => convertJsonObj(element)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //Scenario 2
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `
                SELECT *
                FROM todo
                WHERE
                priority = '${priority}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((element) => convertJsonObj(element)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //Scenario 3
    case hasPriorityAndStatusProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                SELECT *
                FROM todo
                WHERE
                    status = '${status}'
                    AND priority = '${priority}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((element) => convertJsonObj(element)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //Scenario 4
    case hasSearchProperty(request.query):
      getTodoQuery = `
                    SELECT *
                    FROM todo
                    WHERE
                    todo LIKE '%${search_q}%';`;
      data = await db.all(getTodoQuery);
      response.send(data.map((element) => convertJsonObj(element)));
      break;

    //Scenario 5
    case hasCategoryAndStatusProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                SELECT *
                FROM todo
                WHERE
                status = '${status}',
                AND category = '${category}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((element) => convertJsonObj(element)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Scenario 6
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `
                    SELECT *
                    FROM todo
                    WHERE
                    category = '${category}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((element) => convertJsonObj(element)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Scenario 7
    case hasPriorityAndCategoryProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          category === "WORK" ||
          category === "HOME" ||
          category === "LEARNING"
        ) {
          getTodoQuery = `
                      SELECT *
                      FROM todo
                      WHERE
                      category = '${category}'
                      AND priority = '${priority}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((element) => convertJsonObj(element)));
        } else {
          response.status(400);
          response.send("Invalid Todo Category");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    default:
      getTodoQuery = `
            SELECT *
            FROM todo ;`;
      data = await db.all(getTodoQuery);
      response.send(data.map((element) => convertJsonObj(element)));
  }
});

//API 2 -> Returns a todo based on todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getATodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`;
  const getATodoResponse = await db.get(getATodoQuery);
  response.send(convertJsonObj(getATodoResponse));
});

//API 3 -> Return list of all todos /agenda/?date=2021-12-12
app.get("/agenda/", async (request, response) => {
  const { date } = request.query; //Getting date through query
  //   console.log(date);
  //   console.log(isMatch(date, "yyyy-mm-dd"));  // checking format
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd"); //changing format
    console.log(newDate);
    const getDueDate = `
      SELECT *
      FROM todo
      WHERE due_date = '${newDate}';`;
    const getDueDateResponse = await db.all(getDueDate);
    response.send(getDueDateResponse.map((element) => convertJsonObj(element)));
  } else {
    //return error
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4 -> Create a todo
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const createTodoQuery = `
    INSERT INTO
        todo (id, todo, priority, status, category, due_date)
    VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//API 5 -> Update details of todo based on todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  console.log(requestBody);

  const prevTodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};`;
  const prevTodoResponse = await db.get(prevTodoQuery);

  const {
    todo = prevTodoResponse.todo,
    priority = prevTodoResponse.priority,
    status = prevTodoResponse.status,
    category = prevTodoResponse.category,
    dueDate = prevTodoResponse.dueDate,
  } = request.body;

  let updateTodoQuery;

  switch (true) {
    //Status Update
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
              UPDATE todo
              SET
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
               WHERE id = ${todoId}; `;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //Priority Update
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
        updateTodoQuery = `
              UPDATE todo
              SET
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
               WHERE id = ${todoId}; `;
        await db.run(updateTodoQuery);
        response.send("priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //Category Update
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
              UPDATE todo
              SET
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
               WHERE id = ${todoId}; `;
        await db.run(updateTodoQuery);
        response.send("category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //Todo Update
    case requestBody.todo !== undefined:
      updateTodoQuery = `
        UPDATE todo
        SET
        todo = '${todo}',
        priority = '${priority}',
        status = '${status}',
        category = '${category}',
        due_date = '${dueDate}'
        WHERE id = ${todoId}; `;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    //Due Date Update
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
                UPDATE todo
                SET
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
                WHERE id = ${todoId}; `;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//API 6 Delete a todo based on I todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM todo
  WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
