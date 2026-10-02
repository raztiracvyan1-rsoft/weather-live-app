const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

const PORT = process.env.PORT || 3000;

const DATA_FILE = "./visitors.json";


app.use(express.json());

app.use(express.static("public"));


// =====================================
// READ VISITORS
// =====================================

function getVisitors() {

    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }

    try {

        const data =
            fs.readFileSync(
                DATA_FILE,
                "utf8"
            );

        return JSON.parse(data);

    } catch (error) {

        console.error(
            "JSON read error:",
            error
        );

        return [];
    }
}


// =====================================
// SAVE VISITORS
// =====================================

function saveVisitors(visitors) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            visitors,
            null,
            2
        )
    );
}


// =====================================
// ADD VISITOR
// =====================================

app.post(
    "/api/visitors",
    (req, res) => {

        console.log(
            "Visitor received:",
            req.body
        );


        const {
            latitude,
            longitude,
            city,
            country,
            temperature
        } = req.body;


        if (
            typeof latitude !== "number" ||
            typeof longitude !== "number"
        ) {

            return res.status(400).json({
                message: "Invalid location"
            });

        }


        const visitor = {

            id: Date.now(),

            latitude,

            longitude,

            city:
                city || "Unknown",

            country:
                country || "Unknown",

            temperature:
                temperature ?? null,

            time:
                new Date().toISOString()

        };


        const visitors =
            getVisitors();


        visitors.push(visitor);


        saveVisitors(
            visitors
        );


        // Send to all connected admin pages
        io.emit(
            "newVisitor",
            visitor
        );


        res.json({

            success: true,

            visitor

        });

    }
);


// =====================================
// GET VISITORS
// =====================================

app.get(
    "/api/visitors",
    (req, res) => {

        const visitors =
            getVisitors();

        console.log(
            "Sending visitors:",
            visitors
        );

        res.json(
            visitors
        );

    }
);


// =====================================
// DELETE VISITORS
// =====================================

app.delete(
    "/api/visitors",
    (req, res) => {

        saveVisitors([]);

        io.emit(
            "visitorsCleared"
        );

        res.json({
            success: true
        });

    }
);


// =====================================
// SOCKET.IO
// =====================================

io.on(
    "connection",
    (socket) => {

        console.log(
            "Admin connected:",
            socket.id
        );


        const visitors =
            getVisitors();


        console.log(
            "Sending initial visitors:",
            visitors
        );


        socket.emit(
            "visitors",
            visitors
        );

    }
);


// =====================================
// START SERVER
// =====================================

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});