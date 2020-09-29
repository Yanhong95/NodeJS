import { Router } from 'https://deno.land/x/oak/mod.ts';
import { ObjectId } from 'https://deno.land/x/mongo@v0.8.0/mod.ts';

import { getDb } from '../helper/db_client.ts';


const router = new Router();

// 下面的问号表示Todo的创建可以指定id也可以不指定
interface Todo {
  id?: string;
  text: string;
}

router.get('/todos', async (ctx) => {
  const todos = await getDb().collection('todos').find(); // { _id: ObjectId(), text: '...' }[]
  const transformedTodos = todos.map(
    (todo: { _id: ObjectId; text: string }) => {
      // todo._id.$oid mongodb提供的objectId的字符串形式
      return { id: todo._id.$oid, text: todo.text };
    }
  );
  ctx.response.body = { todos: transformedTodos };
});

router.post('/todos', async (ctx) => {
  const data = await ctx.request.body();
  const newTodo: Todo = {
    // id: new Date().toISOString(),
    text: data.value.text,
  };

  const theTodo = await getDb().collection('todos').insertOne(newTodo);

  newTodo.id = theTodo.$oid;

  ctx.response.body = { message: 'Created todo!', todo: newTodo };
});

router.put('/todos/:todoId', async (ctx) => {
  const tid = ctx.params.todoId!;
  const data = await ctx.request.body();

  await getDb().collection('todos').updateOne({ _id: ObjectId(tid) }, { $set: { text: data.value.text } });

  ctx.response.body = { message: 'Updated todo' };
});

router.delete('/todos/:todoId', async (ctx) => {
  const tid = ctx.params.todoId!;

  await getDb().collection('todos').deleteOne({ _id: ObjectId(tid) });

  ctx.response.body = { message: 'Deleted todo' };
});

export default router;
