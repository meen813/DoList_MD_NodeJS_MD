const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
//method-override => html 에서 put 과 delete 사용가능케 해줌
const methodOverride = require('method-override')
require('dotenv').config()

app.use(methodOverride('_method'))
//ejs 파일 사용
app.set('view engine', 'ejs');

//public 폴더를 쓸것임, 미들웨어
app.use('/public', express.static('public'));



// var db;
// MongoClient.connect('mongodb+srv://root:root@clusterapril.s1x2azi.mongodb.net/?retryWrites=true&w=majority', function (error, client) {
//     if (error) return console.log(error)

//     db = client.db('todoapp')

//     app.listen(8080, function () {
//         console.log('listening on 8080')
//     });
// })

//.env
var db;
MongoClient.connect(process.env.DB_URL, function (err, client) {
    if (err) return console.log(err)
    db = client.db('todoapp');
    app.listen(process.env.PORT, function () {
        console.log('listening on 8080')
    })
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

app.delete('/delete', function (req, res) {
    // 요청시 함께 보낸 데이터를 찾으려면...(게시물 번호)
    console.log(req.body)
    //숫자로 변환
    req.body._id = parseInt(req.body._id);
    // 요청 .body에 담겨온 게시물 번호를 가진 글을 db에서 찾아서 삭제해 주세요
    db.collection('post').deleteOne(req.body, function (error, result) {
        console.log('Deletion Complete');
        //요청 성공 200 or status(400) = fail
        res.status(200).send({ message: '성공했습니다' });

        // //counter 라는 collection 에 있는 totalPost 라는 항목을 1 감소 시켜야 함
        // db.collection('counter').updateOne({ name: 'postNum'}, { $inc: {totalPost: -1}}, function(error, result) {
        //     if(error){
        //         return console.log(error)
        //     }
        //     console.log('update complete')
        // })
    })


})


//detail 로 접속하면 detail.ejs 보여줌
//parameter 사용
app.get('/detail/:id', function (req, res) {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (error, result) {
        if (error) {
            return console.log(error);
        }
        if (!result) {
            return res.status(404).send({ message: '없는 자료입니다' });
        }
        console.log(result);
        res.render('detail.ejs', { data: result });
    })
})

app.get('/edit/:id', function (req, res) {
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, function (error, result) {
        if (error) {
            return console.log(error);
        }
        if (!result) {
            return res.status(404).send({ message: '없는 자료입니다' });
        }
        console.log(result);
        res.render('edit.ejs', { data: result });
    })
})

app.put('/edit', function (req, res) {
    //폼에담긴 제목, 날짜 데이터를 가지고 db.collection에 업데이트
    db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set: { title: req.body.title, date: req.body.date } }, function (error, result) {
        console.log("Edit Complete");
        res.redirect('/list');

    })
})

//session 방식 로그인 기능 구현
//1. 설치한 3개의 라이브러리 첨부하기
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy
const session = require('express-session');

//미들웨어(app.use()); 요청-응답 중간에 뭔가 실행되는 코드
app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


app.get('/login', function (req, res) {
    res.render('login.ejs');
})

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), function (req, res) {
    res.redirect('/')
})

//mypage
app.get('/mypage', checkLogin, function(req, res){
    console.log(req.user)
    res.render('mypage.ejs', {user: req.user })
})

function checkLogin(req, res, next) {
    if(req.user) {
        next()
    } else {
        res.send('User did not log in')
    }
}



passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
        passReqToCallback: false,
    }, function (입력한아이디, 입력한비번, done) {
    console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (error, result) {
        if (error) return done(error)
        //id/pw 맞는지 DB와 비교
        //pw를 암호화 시켜야함 현재는 보안이 취약
        if (!result) return done(null, false, { message: 'ID does not exist' })
        if (입력한비번 == result.pw) {
            return done(null, result)
        } else {
            return done(null, false, { message: 'Wrong Password' })
        }
    })
}));


//Session 만들기
//session을 저장시키는 코드(로그인 성공시 발동)
passport.serializeUser(function(user, done){
    done(null, user.id)
});

//my page 접속시 발동; 이 세션 데이터를 가진 사람을 db에서 찾아주세요
passport.deserializeUser(function(아이디, done){
    db.collection('login').findOne({id: 아이디}, function(error, result){
    done(null, result)
    })
});


//Server에서 query string 꺼내는 법
app.get('/search', (req, res) => {
    console.log(req.query.value)
    //text index 만들어 두면 1.빠른 검색 2. or 검색 가능 3. -제외가능 4. "정확히 일치하는 것", but 한,일,중어에는 잼병
    db.collection('post').find( {$text: {$search: req.query.value }}).toArray((error, result)=>{
        console.log(result);
        res.render('searchResult.ejs', {posts: result })
        
    })
})

//indexing


