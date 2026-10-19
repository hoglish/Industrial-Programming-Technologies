import express from 'express';
import path from 'path';

const app = express();
const PORT = 8000;

app.use(express.static('public'));

app.get('/',(req,res)=>{
    res.send('Статика раздана')
})

app.listen(PORT,()=>{
    console.log(`Server is running at http://localhost:${PORT}`)
})
