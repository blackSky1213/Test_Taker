//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const crypto = require("crypto");
const flash = require("express-flash");
var nodemailer = require('nodemailer');
const passportLocalMongoose = require("passport-local-mongoose");
const { parse } = require("path");
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});
//session

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
console.log(process.env.SECRET);
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true });
mongoose.set("useCreateIndex", true);
mongoose.set('useFindAndModify', false);

const resultStudentSechama = new mongoose.Schema({
    enrolment:String,
    marks:Number,
});
const ResultStudent = new mongoose.model("ResultStudent",resultStudentSechama);

const resultSchema = new mongoose.Schema({
    name:String,
    class:String,
    listOfStudent:[resultStudentSechama]
});

const Result = new mongoose.model("Result", resultSchema);
const questionSchema = new mongoose.Schema({
    question: String,
    option1: String,
    option2: String,
    option3: String,
    option4: String,
    answer: String,

});

const Question = new mongoose.model("Question", questionSchema);

const testSchema = new mongoose.Schema({
    name: String,
    totalMark: Number,
    totalQuestion: Number,
    class: String,
    passingMark: Number,
    ExamTime: String,
    ExamOverTime: String,
    ExamDate: String,
    testurl:String,
    listOfQuestion: [questionSchema],
});

const Test = new mongoose.model("Test", testSchema);

const studentSchema = new mongoose.Schema({
    enrolment: { type: String, unique: true, dropDups: true },
    email: { type: String, unique: true, dropDups: true },
    password: String,
    
});
const Student = new mongoose.model("Student", studentSchema);

const classSchema = new mongoose.Schema({
    name: String,
    listOfStudent: [studentSchema]
});
const Class = new mongoose.model("Class", classSchema);

const userSchema = new mongoose.Schema({
    name: String,
    collegeName: String,
    username: String,
    password: String,
    listOfClass: [classSchema],
    listOfTest: [testSchema],
    listOfResult:[resultSchema]
});

userSchema.plugin(passportLocalMongoose);



const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//all get route

app.get("/", (req, res) => {
    res.render("login",{message:req.flash("error")});
});


app.get("/registation", (req, res) => {
    console.log(req.flash());
    res.render("register");
});



app.get("/dashboard", (req, res) => {

    if (req.isAuthenticated()) {
        User.findById(req.user.id, (err, foundData) => {


            res.render("dashboard", { username: foundData.name,listOfTest:foundData.listOfTest});
        });
    }
});

app.get("/noscript",(req,res)=>{

    res.render("flashMessage",{message:"please enable javascript"});
});

app.get("/addStudent/:ClassName", (req, res) => {

    if (req.isAuthenticated()) {
        User.findById(req.user.id, (err, foundStudent) => {
            if (foundStudent) {

                for (var i = 0; i < foundStudent.listOfClass.length; i++) {
                    if (foundStudent.listOfClass[i].name == req.params.ClassName) {
                        var StudentList = foundStudent.listOfClass[i].listOfStudent;

                        res.render("addStudent", { username: foundStudent.name, ClassName: req.params.ClassName, listStudent: StudentList });
                    }
                }


            } else {
                console.log(err);
            }
        });
    }

});



app.get("/class", (req, res) => {
    if (req.isAuthenticated()) {
        User.findById(req.user.id, (err, foundClass) => {

            if (foundClass) {

                res.render("class", { username: foundClass.name, listclass: foundClass.listOfClass, }); //,{listOfClass:foundClass.listOfClass}
            } else {
                console.log(err);
            }

        });
    }

});

app.get("/result", (req, res) => {
    if (req.isAuthenticated()) {
        User.findById(req.user.id, (err, foundClass) => {

            if (foundClass) {

                res.render("result", { username: foundClass.name, listresult: foundClass.listOfResult }); //,{listOfClass:foundClass.listOfClass}
            } else {
                console.log(err);
            }

        });
    }

});

app.get("/resultClass/:TestName", (req, res) => {

    if (req.isAuthenticated()) {
        User.findById(req.user.id, (err, foundStudent) => {
            if (foundStudent) {
                console.log(req.params.TestName);
                for (var i = 0; i < foundStudent.listOfResult.length; i++) {
                        console.log(foundStudent.listOfResult[i].name); 
                    if (foundStudent.listOfResult[i].name == req.params.TestName) {
                        var StudentList = foundStudent.listOfResult[i].listOfStudent;

                        res.render("resultClass", { username: foundStudent.name, TestName: req.params.TestName, listresult: StudentList });
                    }
                }


            } else {
                console.log(err);
            }
        });
    }

});

app.get("/UpdateTime/:TestId",(req,res)=>{

    if(req.isAuthenticated()){
        User.findOne({ _id: req.user.id }, (err, foundStudent) => {
            var date;
            var time;
            var OverTime;
            if (foundStudent) {
    
                
                for (var i = 0; i < foundStudent.listOfTest.length; i++) {
    
                    if (foundStudent.listOfTest[i]._id == req.params.TestId) {
    
                             date=foundStudent.listOfTest[i].ExamDate;
                             time=foundStudent.listOfTest[i].ExamTime;
                            OverTime=foundStudent.listOfTest[i].ExamOverTime;
                            
                            console.log(date);
                            console.log(time);
                            console.log(OverTime);
                            break;
                    }
                    
                }
                res.render("updateTimeDate",{username:req.user.name,TestId:req.params.TestId,Date:date,Time:time,overTime:OverTime});
                
            }
        });
        
    }
    

});

app.get("/create_test", (req, res) => {
    if (req.isAuthenticated()) {
        User.findById(req.user.id, (err, foundClass) => {

            if (foundClass) {

                res.render("create_test", { username: foundClass.name, listclass: foundClass.listOfClass, }); //,{listOfClass:foundClass.listOfClass}
            } else {
                console.log(err);
            }

        });

    }
});

app.get("/create_mcq/:TestId/:TotalQuestion", (req, res) => {
    if (req.isAuthenticated()) {
        var totalquestion=parseInt(req.params.TotalQuestion);
        if(totalquestion>0){
            totalquestion-=1;
        res.render("create_mcq", { username: req.user.name, TestId: req.params.TestId, TotalQuestion: totalquestion });
        }else{
            res.redirect("/quiz/" + req.params.TestId);
        }
    }
});

app.get("/quiz/:TestId", (req, res) => {

    User.findById(req.user.id, (err, foundStudent) => {

        if (foundStudent) {
            var test = [];
            var TestName;
            var marks;
            var totalquestion;
            for (var i = 0; i < foundStudent.listOfTest.length; i++) {

                if (foundStudent.listOfTest[i]._id == req.params.TestId) {
                    TestName = foundStudent.listOfTest[i].name;
                    marks = foundStudent.listOfTest[i].totalMark;
                    totalquestion = foundStudent.listOfTest[i].totalQuestion;
                    var testPath = foundStudent.listOfTest[i].listOfQuestion;
                    for (var j = 0; j < testPath.length; j++) {
                        var add = [testPath[j].question, testPath[j].option1, testPath[j].option2, testPath[j].option3, testPath[j].option4, testPath[j].answer];
                        test.push(add);


                    }

                }
            }
            res.render("quiz", { Quiz: test, TestId: req.params.TestId, TestName: TestName, marks: marks, totalquestion: totalquestion });

        } else {
            console.log(err);
        }


    });

});

app.get("/StudentLogin/:TestId/:userId", (req, res) => {

    res.render("StudentLogin", { TestId: req.params.TestId, userid: req.params.userId });

});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});


app.get("/TestStart/:TestId/:userId/:enrolment", (req, res) => {

    User.findById(req.params.userId, (err, foundStudent) => {

        if (foundStudent) {
            var test = [];
            var TestName;
            var marks;
            var totalquestion;
            for (var i = 0; i < foundStudent.listOfTest.length; i++) {

                if (foundStudent.listOfTest[i]._id == req.params.TestId) {
                    TestName = foundStudent.listOfTest[i].name;
                    marks = foundStudent.listOfTest[i].totalMark;
                    totalquestion = foundStudent.listOfTest[i].totalQuestion;
                    var testPath = foundStudent.listOfTest[i].listOfQuestion;
                    for (var j = 0; j < testPath.length; j++) {
                        var add = [testPath[j].question, testPath[j].option1, testPath[j].option2, testPath[j].option3, testPath[j].option4, testPath[j].answer];
                        test.push(add);


                    }

                }
            }
            res.render("TestStart", { Quiz: test, TestId: req.params.TestId, TestName: TestName, marks: marks, totalquestion: totalquestion, userId: req.params.userId, enrolment: req.params.enrolment });

        } else {
            console.log(err);
        }


    });

});

app.get("/testDelete/:TestId", (req, res) => {

    const removeStudentId = req.params.TestId;
    User.findOneAndUpdate({ _id: req.user.id,  }, { $pull: { "listOfTest": { _id: removeStudentId } } }, (err, foundUser) => {

        if (err) {
            console.log(err);
        } else {
            res.redirect("/dashboard");
        }
    });



});

// all post route

app.post("/registation", (req, res) => {

    const newUserName = req.body.name;
    const newCollegeName = req.body.college_name;
    const newEmail = req.body.username;
    const newPassword = req.body.password;

    User.register({ username: newEmail }, newPassword, (err, user) => {
        if (err) {
            console.log(err);

            res.redirect("/registation");
        } else {
            passport.authenticate("local",{failureRedirect:"/registation",failureFlash:true,failureMessage:"This email already register!"})(req, res, () => {

                User.findById(req.user.id, (err, foundUser) => {
                    if (!foundUser) {
                        console.log(err);
                    } else {

                        foundUser.name = newUserName;
                        foundUser.collegeName = newCollegeName;
                        foundUser.save(() => {
                            res.redirect("/dashboard");
                        });
                    }

                });
            });
        }
    });


});

app.post("/", (req, res) => {

    const verifyUser = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(verifyUser, (err) => {
        if (err) {
            console.log(err);
        } else {
            
            passport.authenticate("local",{failureRedirect:"/",failureFlash:true,failureMessage:"Invalid username & password!"})(req, res, () => {
                res.redirect("/dashboard");
            });
        }
    });

});

app.post("/class", (req, res) => {

    const className = req.body.className;
    const addClass = new Class({

        name: className

    });

    User.findById(req.user.id, (err, foundClass) => {
        if (foundClass) {
            foundClass.listOfClass.push(addClass);
            foundClass.save();
            res.redirect("/class");
        }
    });



});


app.post("/addStudent", (req, res) => {

    try {

        const passcode = crypto.randomBytes(16).toString("hex");
        const Classname = req.body.ClassName;
        const addStudent = new Student({
            enrolment: req.body.studentName,
            email: req.body.email,
            password: passcode,
            session: false,
            testgiven: false
        });
        User.findById(req.user.id, (err, foundStudent) => {

            if (foundStudent) {

                for (var i = 0; i < foundStudent.listOfClass.length; i++) {

                    if (foundStudent.listOfClass[i].name == Classname ) {

                        foundStudent.listOfClass[i].listOfStudent.push(addStudent);

                        foundStudent.save((err) => {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                var mailOptions = {
                                    from: 'kbsarvaiya123@gmail.com',
                                    to: req.body.email,
                                    subject: 'secret key of give exam',
                                    text: "your passcode :- " + passcode+". Your className is :- "+Classname
                                };
                                transporter.sendMail(mailOptions, function (error, info) {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        console.log('Email sent: ' + info.response);
                                        
                                    }
                                });
                               
                            }
                        });
                        res.redirect("/addStudent/" + Classname + "/");

                    }
                }
            } else {
                console.log(err);
            }


        });
    }
    catch (err) {
        console.log(err);
    }

});

app.post("/delete", (req, res) => {

    const removeStudentId = req.body.checkBox;
    const ClassName = req.body.ClassName;
    User.findOneAndUpdate({ _id: req.user.id, "listOfClass.name": ClassName }, { $pull: { "listOfClass.$.listOfStudent": { _id: removeStudentId } } }, (err, foundUser) => {

        if (err) {
            console.log(err);
        } else {
            res.redirect("/addStudent/" + ClassName);
        }
    });



});

app.post("/deleteClass", (req, res) => {

    const removeClassId = req.body.checkBox;
    User.findOneAndUpdate({ _id: req.user.id}, { $pull: { listOfClass: { _id: removeClassId } } }, (err, foundUser) => {

        if (err) {
            console.log(err);
        } else {
            res.redirect("/class");
        }
    });



});



app.post("/create_test", (req, res) => {
    const TestName = req.body.test_name;
    const TestClass = req.body.class;
    const TotalMarks = req.body.total_marks;
    const PassMark = req.body.pass_mark;
    const TotalQuestion = req.body.total_question;
    const TestDate = req.body.date;
    const TestTime = req.body.time;
    const TestOverTime = req.body.Overtime;

    const addTest = new Test({
        name: TestName,
        totalMark: TotalMarks,
        totalQuestion: TotalQuestion,
        class: TestClass,
        passingMark: PassMark,
        ExamTime: TestTime,
        ExamOverTime: TestOverTime,
        ExamDate: TestDate
    });
    const addResult = new Result({
        name:TestName,
        class:TestClass
    });
    User.findById(req.user.id, (err, foundUser) => {
        foundUser.listOfTest.push(addTest);
        
        foundUser.listOfResult.push(addResult);
        foundUser.save();
        res.redirect("/create_mcq/" + foundUser.listOfTest[foundUser.listOfTest.length - 1]._id + "/" + TotalQuestion);
    });



});

app.post("/create_mcq/:TestId/:TotalQuestion", (req, res) => {

    const addQuestion = new Question({
        question: req.body.question,
        option1: req.body.option1,
        option2: req.body.option2,
        option3: req.body.option3,
        option4: req.body.option4,
        answer: req.body.correctAnswer
    });


        User.findById(req.user.id, (err, foundStudent) => {

            if (foundStudent) {

                for (var i = 0; i < foundStudent.listOfTest.length; i++) {

                    if (foundStudent.listOfTest[i]._id == req.params.TestId) {

                        foundStudent.listOfTest[i].listOfQuestion.push(addQuestion);
                        foundStudent.save();
                        return res.redirect("/create_mcq/" + req.params.TestId + "/" + req.params.TotalQuestion);

                    }
                }

            } else {
                console.log(err);
            }

        });



});



app.post("/quiz/:TestId", (req, res) => {

    var fullUrl = req.protocol + '://' + req.get('host');
    User.findById(req.user.id,(err,foundData)=>{

        if(foundData){
            for(var i=0;i<foundData.listOfTest.length;i++){
                if(foundData.listOfTest[i]._id == req.params.TestId){

                    foundData.listOfTest[i].testurl=fullUrl + "/StudentLogin/" + req.params.TestId + "/" + req.user.id;
                    foundData.save();
                    break;
                }
            }
        }

    });
    res.redirect("/dashboard");

});

app.post("/StudentLogin/:TestId/:userId", (req, res) => {

    var enrolment = req.body.enrolment;
    const id = req.params.userId;
    const TestId = req.params.TestId;
    var className;
    var ExamStartDateTime="";
    User.findOne({ _id: id }, (err, foundStudent) => {


        if (foundStudent) {
            
            for (var i = 0; i < foundStudent.listOfTest.length; i++) {

                if (foundStudent.listOfTest[i]._id == TestId) {

                    className = foundStudent.listOfTest[i].class;
                    ExamStartDateTime=foundStudent.listOfTest[i].ExamDate+" "+foundStudent.listOfTest[i].ExamTime;
                    console.log(ExamStartDateTime);
                    break;

                }
            }
            var now=new Date().getTime()/1000;
            var start=new Date(ExamStartDateTime).getTime()/1000;
            console.log(now);
            console.log(start);
            for (var i = 0; i < foundStudent.listOfClass.length; i++) {
                if (foundStudent.listOfClass[i].name == className) {
                    var j = 0;
                    var lock=true;
                    for (j = 0; j < foundStudent.listOfClass[i].listOfStudent.length; j++) {
                        if (foundStudent.listOfClass[i].listOfStudent[j].enrolment == enrolment && foundStudent.listOfClass[i].listOfStudent[j].password == req.body.password) {
                           lock=false;
                           break;
                        }
                        // else {
                        //      res.send("your have no test today");
                        // }
                    }

                    if (lock== true) {

                        res.render("flashMessage",{message:"your have no test today"});

                    }else{
                        if(now <= start){
                            res.render("flashMessage",{message:"You may be come early, just wait for right time"})
                        }
                        else{
                            lock=false;
                        return res.redirect("/TestStart/" + TestId + "/" + id + "/" + enrolment);
                        }
                    }

                }

            }

        } else {

            console.log(err);

        }

    });

});

app.post("/TestStart/:TestId/:userId/:enrolment", (req, res) => {

    var TotalQuestion;
    var TotalMarks;
    var TestId = req.params.TestId;
    var CorrectAnswer = [];
    var TestName;
    var Test;
    var className;
    var result = 0;
    User.findOne({ _id: req.params.userId }, (err, foundStudent) => {
        var ExamStartDateTime;
        if (foundStudent) {

            
            for (var i = 0; i < foundStudent.listOfTest.length; i++) {

                if (foundStudent.listOfTest[i]._id == TestId) {

                    TotalMarks = foundStudent.listOfTest[i].totalMark;
                    TotalQuestion = foundStudent.listOfTest[i].totalQuestion;
                    Test = foundStudent.listOfTest[i];
                    TestName=foundStudent.listOfTest[i].name;
                    className = foundStudent.listOfTest[i].class;
                    ExamStartDateTime=foundStudent.listOfTest[i].ExamDate+" "+foundStudent.listOfTest[i].ExamOverTime;
                }

            }
            var testgiven=null;
            for(var i=0;i<foundStudent.listOfResult.length;i++){

                if(foundStudent.listOfResult[i].name == TestName)
                {
                    for(var j=0;j<foundStudent.listOfResult[i].listOfStudent.length;j++){
                        if(foundStudent.listOfResult[i].listOfStudent[j].enrolment == req.params.enrolment){
                          testgiven=foundStudent.listOfResult[i].listOfStudent[j].enrolment;
                           break;
                        }
                    }
                }
            }
            console.log(testgiven);
            if(testgiven == req.params.enrolment)
            {
                res.render("flashMessage",{message:"you submited your response!"});
            }
            else{
                var now=new Date().getTime()/1000;
                var end=new Date(ExamStartDateTime).getTime()/1000;
            console.log(now);
            console.log(end);
                if(end >= now){
                    for (var i = 0; i < Test.listOfQuestion.length; i++) {

                        CorrectAnswer.push(Test.listOfQuestion[i].answer);
        
                    }
        
                    console.log(CorrectAnswer);
                    console.log((parseInt(TotalMarks) / parseInt(TotalQuestion)));
                    console.log(req.body);
        
                    for (var i = 0; i < CorrectAnswer.length; i++) {
        
                        console.log(req.body[i]);
                        if (CorrectAnswer[i] == req.body[i]) {
        
                            result = result + (parseInt(TotalMarks) / parseInt(TotalQuestion));
        
                        }
        
                    }
                    
                    const addResultStudent = new ResultStudent({
                        enrolment:req.params.enrolment,
                        marks:result
                    });
        
        
                    for (var i = 0; i < foundStudent.listOfResult.length; i++) {
        
                        if (foundStudent.listOfResult[i].name == TestName) {
        
                            foundStudent.listOfResult[i].listOfStudent.push(addResultStudent);
                            foundStudent.save();
                            res.render("flashMessage",{message:"your result is "+ result+"/"+TotalMarks});
                            break;
                            
                            
                        }
                    }
                }
                else{
                    res.render("flashMessage",{message:"Sorry time is up!"});
                }
    
            }
            


        }

    });

});

app.post("/UpdateTime/:TestId",(req,res)=>{
    console.log(req.body);
    console.log(req.params.TestId);
    User.findOne({ _id: req.user.id }, (err, foundStudent) => {

        if (foundStudent) {

            
            for (var i = 0; i < foundStudent.listOfTest.length; i++) {

                if (foundStudent.listOfTest[i]._id == req.params.TestId) {

                        foundStudent.listOfTest[i].ExamDate=req.body.date;
                        foundStudent.listOfTest[i].ExamTime=req.body.time;
                        foundStudent.listOfTest[i].ExamOverTime=req.body.Overtime;
                        
                        break;
                }

            }
            foundStudent.save((err)=>{
                if(err){
                    console.log(err);
                }
                else{
                    res.redirect("/dashboard"); 
                }
            });
            
        }
    });

});

app.listen(3000, () => {

    console.log("Server is now alive. http://127.0.0.1:3000");

});