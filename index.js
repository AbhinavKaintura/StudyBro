
import express  from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import multer from "multer"

const port = 3000
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
const saltRounds = 10;
const storage = multer.memoryStorage()
const upload = multer({storage: storage});
env.config();

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
//app.use(express.static('css'));
//app.set('view engine', 'ejs');
app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();

app.get("/" , (req, res ) => {
    res.render(__dirname + "/views/home.ejs");
});

app.get("/login_button" , (req, res) => {
    res.render(__dirname + "/views/login.ejs");
});

app.get("/register_button", (req, res) => {
    res.render(__dirname + "/views/register.ejs");
});

app.get("/createpost", (req, res) => {
    res.render(__dirname + "/views/createposts2.ejs")
})

app.get("/home_createpost", (req, res) =>{
    res.render(__dirname + "/views/createposts2.ejs")
})

app.get("/bg2", (req, res) => {
    res.render(__dirname + "/views/createblog.ejs")
})

app.post("/blogpg1" , (req , res) => {
    res.render(__dirname + "/views/createblog.ejs");
});

app.post("/lifeshort" , (req , res) =>{
    res.render(__dirname + "/views/lifeisshort.ejs");
});

app.post("/ageessay" , (req, res) => {
    res.render(__dirname + "/views/ageofessay.ejs");
});

app.post("/kids" , (req, res) => {
    res.render(__dirname + "/views/havekids.ejs");
});

app.get("/logout", (req,res) => {
    req.logout(function (err) {
        if(err) {
            return next(err);
        }
        res.render("/");
    })
})

app.get("/allposts", async (req, res) => {
    console.log("Hit the all posts route for now using google auth")
    if(req.isAuthenticated()) {
        try {
            res.render("allposts.ejs");
        }
        catch(err) {
            console.log(err);
        }
    }
    else {
        res.render("/login")
    }
})

app.get("/myblog", async (req, res) => {
    //console.log(req.user);

    if(req.isAuthenticated()) {
        try {
            let result = await db.query(`SELECT text FROM users WHERE email = $1`, [req.user.email]);
            console.log("checking for inserted blog and result ==> ")
            //console.log(result);
            let blog = result.rows[0].text;
            console.log("My blog is ", blog)
            if(blog) {
                res.render("myblog.ejs", { blog: blog});
//add myblog.ejs when we need to add a blog res.render("myblog.ejs", { blog: blog});

            } else {
                res.render("myblog.ejs", { blog: "Enter your blog. "});
            }
        } catch (err) {
            console.log(err)
        }
    } else {
        res.redirect("/login")
    }
} )

app.get("/submit", function (req, res) {
    if(req.isAuthenticated()) {
        res.render("submit.ejs");
    } else {
        res.redirect("/login.ejs");
    }
})

app.get(
    "/auth/google", 
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );
  
  app.get(
    "/auth/google/secrets", 
    passport.authenticate("google", {
      //successRedirect: "/myblog",
      successRedirect: "/allposts",
      failureRedirect: "/login",
    })
  );

app.post("/login", passport.authenticate("local", {
    //successRedirect: "/allposts",
    successRedirect: "/myblog",
    failureRedirect: "/login_button",
}));



app.post("/register", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;
    try {

        const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if(checkResult.rows.length > 0) {
            res.redirect("/login_button");
        } else {
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if(err) {
                    console.log("error while hashing password : ", err);
                } else {
                    const result = await db.query("INSERT INTO users(email, password, username) VALUES ($1, $2, $3) RETURNING *",[email, hash, req.body.name_user]);
                    const user = result.rows[0];
                    req.login(user, (err) => {
                        console.log("success");
                        res.redirect("/myblog");
                    })
                }
            })
        }
    } catch (err) {
        console.log(err);
    }
})

app.post("/createpostss", async (req, res) => {
    console.log("Entered the post creation route");
    const text_content = req.body.message;
    console.log('My text is ')
    console.log(text_content)
    // const image = req.files['postImage'] ? req.files['image'][0] : null;  // Image file
    // console.log("THis will run if image is loaded in image variable")
    // const video = req.files['postVideo'] ? req.files['postVideo'][0] : null;  // Video file
    // const audio = req.files['postAudio'] ? req.files['postAudio'][0] : null;  // Audio file

    if(req.isAuthenticated()) {
        try {
            const user_id = req.user.user_id
            console.log(user_id)
            // const query = `
            //     INSERT INTO posts (user_id, post_text, post_image, post_video, post_audio) 
            //     VALUES ($1, $2, $3, $4) RETURNING post_id`;
            // const values = [
            //     req.user.user_id,
            //     text_content,
            //     image? image.buffer : null,
            //     video? video.buffer : null,
            //     audio? audio.buffer : null
            // ];

            const query = `
                INSERT INTO posts (user_id, post_text) VALUES ($1, $2) RETURNING post_id`;
            const values = [req.user.user_id, text_content]

            const result = db.query(query, values);
            console.log(result);
            res.status(200).send(`Post created successfully with ID: ${result.rows[0].post_id}`);
        }
        catch(err) {
            console.log(err)
        }
    }
    else {
        console.log("Unauthenticated user")
        res.redirect("/login_button")
    }
})

app.post("/submit_blog", async function (req, res) {
    const submittedBlog = req.body.blog;
    console.log(req.user.email);
    try {
        await db.query(`UPDATE users SET text = $1 WHERE email = $2`, [submittedBlog, req.user.email,])
        console.log("updating the text")
        res.redirect("/myblog");
    } catch (err) {
        console.log(err);
    }
})

passport.use("local", new Strategy(async function verify(username, password, cb) {
    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [username]);

        if(result.rows.length > 0) {
            const user = result.rows[0];
            const storedHashedPassword = user.password;
            bcrypt.compare(password, storedHashedPassword, (err, valid) => {
                if (err) {
                    console.log("error comparing passwords ", err);
                    return cb(err);
                } else {
                    if(valid) {
                        return cb(null, user);
                    }
                    else {
                        return cb(null, false);
                    }
                }
            })
        } else {
            return cb("User not found.");
        }
    } catch (err) {
        console.log(err);
    }
}));

passport.use("google", new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret : process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async(accessToken, refreshToken, profile, cb) => {
        try {
            const result = await db.query("SELECT * FROM users WHERE email = $1", [profile.email,]);
            if(result.rows.length === 0 ){
                const newUser = await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [profile.email, "google"]);
                return cb(null, newUser.rows[0]);
            } else {
                return cb(null, result.rows[0]);
            }
        } catch {
            return cb(err);
        }
    }
));

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((user, cb) => {
    cb(null, user);
});

app.listen(port, () => {
    console.log(`Listening on port http://localhost:${port}`);
});
 