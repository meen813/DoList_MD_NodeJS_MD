var router = require('express').Router();

function checkLogin(req, res, next) {
    if (req.user) {
        next()
    } else {
        res.send('User have not logged in')
    }
}

//여기있는 모든 URL에 적용할 미들웨어, 개별적 적용도 가능
router.use(checkLogin,);

router.get('/sports', function (요청, 응답) {
    응답.send('스포츠 게시판');
});

router.get('/game', function (요청, 응답) {
    응답.send('게임 게시판');
}); 

module.exports = router;