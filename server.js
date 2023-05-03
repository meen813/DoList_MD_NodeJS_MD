const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;

//ejs 파일 사용
app.set('view engine', 'ejs');

//public 폴더를 쓸것임, 미들웨어
app.use('/public', express.static('public'));


var db;
MongoClient.connect('mongodb+srv://root:root@clusterapril.s1x2azi.mongodb.net/?retryWrites=true&w=majority', function (error, client) {
    if (error) return console.log(error)

    db = client.db('todoapp')

    // db.collection('post').insertOne({name: 'Ian Hwang', age : 30, _id : 100}, function(error, res){
    //     console.log('save success')
    // });

    app.listen(8080, function () {
        console.log('listening on 8080')
    });
})

app.get('/pet', (req, res) => {
    res.send('Hi this is pets')
})

app.get('/beauty', (req, res) => {
    res.send('뷰티용품사세요')
})

app.get('/', (req, res) => {
    res.render('index.ejs')
});

app.get('/write', (req, res) => {
    res.render('write.ejs')
});


app.post('/add', function (req, res) {
    res.send('transmission complete');
    // /add 를 실행하면...
    // 1.counter collection 에 있는 postNum이라는 이름의 자료에서 totalPost를 찾아서 가져옴 
    db.collection('counter').findOne({ name: 'postNum' }, function (error, result) {
        console.log(result.totalPost)
        //totalPost를 변수에 저장
        let totalPostNum = result.totalPost
        //2. _id를 1 증가 시키고 데이터를 생성함
        db.collection('post').insertOne({ _id: totalPostNum + 1, title: req.body.title, date: req.body.date }, function (error, result) {
            console.log('save success')

            //3. counter라는 collection에 있는 totalPost 라는 항목도 1증가 시켜야함(update)
            db.collection('counter').updateOne({ name: 'postNum' }, { $inc: { totalPost: 1 } }, function (error, result) {
                if (error) {
                    return console.log(error)
                }
                console.log('update complete')
            })
        });
    });
})



// 서버에서 .html 말고 .ejs 파일 보내주는 방법
app.get('/list', (req, res) => {

    // db 에 저장된 post 라는 collection 안의 모든 데이터를 꺼내주세요
    db.collection('post').find().toArray(function (error, result) {
        if (error) {
            console.log(error)
        }
        console.log(result)

        // 위에서 찾은 데이터를 ejs 파일로 넣어주세요
        res.render('list.ejs', { posts: result });
    })
});

app.delete('/delete', function(req, res){
    // 요청시 함께 보낸 데이터를 찾으려면...(게시물 번호)
    console.log(req.body)
    //숫자로 변환
    req.body._id = parseInt(req.body._id); 
    // 요청 .body에 담겨온 게시물 번호를 가진 글을 db에서 찾아서 삭제해 주세요
    db.collection('post').deleteOne(req.body, function(error, result){
        console.log('Deletion Complete');
        //요청 성공 200 or status(400) = fail
        res.status(200).send({message : '성공했습니다'});

        //counter 라는 collection 에 있는 totalPost 라는 항목을 1 감소 시켜야 함
        db.collection('counter').updateOne({ name: 'postNum'}, { $inc: {totalPost: -1}}, function(error, result) {
            if(error){
                return console.log(error)
            }
            console.log('update complete')
        })
    })


})


//detail 로 접속하면 detail.ejs 보여줌
//parameter 사용
app.get('/detail/:id', function(req, res){
    db.collection('post').findOne({_id: parseInt(req.params.id)}, function(error, result){
        if (error) {
            return console.log(error);
        }
        if (!result) {
            return res.status(404).send({message:'없는 자료입니다'});
        }   
        console.log(result);
        res.render('detail.ejs', { data: result });
    })
})