const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
//method-override => html 에서 put 과 delete 사용가능케 해줌
const methodOverride = require('method-override')
require('dotenv').config()
const {ObjectId} = require('mongodb')

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


app.get('/', (req, res) => {
    res.render('index.ejs')
});

app.get('/write', (req, res) => {
    res.render('write.ejs')
});



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

// // Add this middleware
// app.use(function(req, res, next) {
//     res.locals.currentUser = req.user;
//     next();
// });


// 서버에서 .html 말고 .ejs 파일 보내주는 방법
app.get('/list', (req, res) => {

    // db 에 저장된 post 라는 collection 안의 모든 데이터를 꺼내주세요
    db.collection('post').find().toArray(function (error, result) {
        if (error) {
            console.log(error)
        }
        console.log(result)

        // 위에서 찾은 데이터를 ejs 파일로 넣어주세요
        res.render('list.ejs', { posts: result, currentUser: req.user });
    })
});



app.get('/login', function (req, res) {
    res.render('login.ejs');
})

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), function (req, res) {
    res.redirect('/')
})

//mypage
app.get('/mypage', checkLogin, function (req, res) {
    console.log(req.user)
    res.render('mypage.ejs', { user: req.user })
})

//mypage 접속 전 실행할 미들웨어; 로그인 했는지 체크해주는 함수
function checkLogin(req, res, next) {
    if (req.user) {
        next()
    } else {
        res.send('User have not logged in')
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
passport.serializeUser(function (user, done) {
    done(null, user.id)
});

//my page 접속시 발동; 이 세션 데이터를 가진 사람을 db에서 찾아주세요
passport.deserializeUser(function (아이디, done) {
    db.collection('login').findOne({ id: 아이디 }, function (error, result) {
        done(null, result)
    })
});

//회원가입기능; passport 셋팅하는 부분이 위에 있어야 함.
//추가 구현해야 할 것들 -id에 알파벳 숫자만 잘 들어있는가 - 비번 저장 전에 암호화 했나
app.post('/register', function (req, res) {
    db.collection('login').findOne({ id: req.body.id }, function (error, result) {
        if (result) {
            res.status(400).send({ message: 'This ID is already Taken' });
        } else {
            db.collection('login').insertOne({ id: req.body.id, pw: req.body.pw }, function (error, result) {
                res.redirect('/')
            })
        }
    })
})



//Server에서 query string 꺼내는 법
app.get('/search', (req, res) => {
    var 검색조건 = [
        {
            $search: {
                index: 'titleSearch',
                text: {
                    query: req.query.value,
                    path: ['title', 'date']  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
                }
            }
        }
    ]
    db.collection('post').aggregate(검색조건).toArray((error, result) => {
        console.log(result);
        res.render('searchResult.ejs', { posts: result })

    })
})


//글 upload
app.post('/add', function (req, res) {
    res.send('transmission complete');
    // /add 를 실행하면...
    // 1.counter collection 에 있는 postNum이라는 이름의 자료에서 totalPost를 찾아서 가져옴 
    db.collection('counter').findOne({ name: 'postNum' }, function (error, result) {
        console.log(result.totalPost)
        //totalPost를 변수에 저장
        let totalPostNum = result.totalPost

        let 저장할거 = { _id: totalPostNum + 1, title: req.body.title, date: req.body.date, author: req.user._id }


        //2. _id를 1 증가 시키고 데이터를 생성함
        db.collection('post').insertOne(저장할거, function (error, result) {
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


app.delete('/delete', function (req, res) {
    // 요청시 함께 보낸 데이터를 찾으려면...(게시물 번호)
    console.log(req.body)
    //숫자로 변환
    req.body._id = parseInt(req.body._id);

    //기능 추가: 실제 로그인 중인 유저의_id 와 글에 저장된 유저의_id가 일치하면 삭제해 주세요
    let dataToDelete = { _id: req.body._id, author: req.user._id }

    // 요청 .body에 담겨온 게시물 번호를 가진 글을 db에서 찾아서 삭제해 주세요
    db.collection('post').deleteOne(dataToDelete, function (error, result) {
        console.log('Deletion Complete');
        if (result) { console.log(result) }
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


//app.use; 미들웨어
app.use('/shop', require('./routes/shop.js'))


//로그인 한 사람만 방문 가능케 특정 라우터파일에 미들웨어를 적용하고 싶다면...
app.use('/board/sub', checkLogin, require('./routes/board.js'))


//multer를 이용한 이미지 하드에 저장하기
let multer = require('multer')
var storage = multer.diskStorage({
    //public/image 폴더 안에 이미지 저장
    destination: function (req, file, cb) {
        cb(null, './public/image')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    },
    filefilter: function (req, file, cb) {

    }
});

var upload = multer({ storage: storage });


app.get('/upload', (req, res) => {
    res.render('upload.ejs')
});

//이미지업로드 기능 추가
app.post('/upload', upload.single('profile'), function (req, res) {
    res.send('업로드 완료')
});

//이미지 보여주기
app.get('/image/:imageName', function (req, res) {
    res.sendFile(__dirname + '/public/image/' + req.params.imageName)
})

//이미지ejs?
app.get('/showImage', (req, res) => {
    // public 폴더의 이미지 파일 목록을 조회합니다.
    const fs = require('fs');
    const path = require('path');
    const imageDir = path.join(__dirname, 'public', 'image');

    fs.readdir(imageDir, (err, files) => {
        if (err) {
            console.error('Failed to read image directory:', err);
            return res.status(500).send('Failed to read image directory');
        }

        // 이미지 파일 목록을 전달합니다.
        res.render('image', { images: files });
    });
});


app.post('/chatroom', checkLogin, function(req, res){

    var 저장할거 = {
        title : '무슨무슨채팅방',
        member : [ObjectId(req.body.당한사람id), req.user._id],
        date : new Date()
    }

    db.collection('chatroom').insertOne(저장할거).then((result)=>{
        res.send('성공')
    })
})



app.get('/chat', (req, res) => {
    res.render('chat.ejs')
});