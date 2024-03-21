const net = require("net");
const fs = require("fs");
const pathModule = require("path");
// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const CRLF = "\r\n";
const STATUS_OK = `HTTP/1.1 200 OK${CRLF}`;
const STATUS_CREATED = `HTTP/1.1 201 CREATED${CRLF}${CRLF}`;
const STATUS_NOTFOUND = `HTTP/1.1 404 NOT FOUND${CRLF}${CRLF}`;
const METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
};

// Function to convert headers array to key-value pairs
function headersToKeyValuePairs(headers) {
  const keyValuePairs = {};
  headers.forEach((header) => {
    // Skip empty headers
    if (header && header.trim() !== "") {
      const [key, value] = header.split(":");
      keyValuePairs[key.trim()] = value?.trim() || "";
    }
  });
  return keyValuePairs;
}

function getDirectory() {
  const args = process.argv;
  const dirIndex = args.indexOf("--directory");
  console.log(args[dirIndex + 1]);
  return args[dirIndex + 1];
}

const dir = getDirectory();

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const bufferString = data.toString("utf-8");
    const [req, ...headers] = bufferString.split(CRLF);
    const [method, path, version] = req.split(" ");

    const headersKeyValue = headersToKeyValuePairs(headers);

    if (method === METHODS.GET) {
      if (path.startsWith("/files")) {
        const fName = path.substring(7);
        const fPath = pathModule.join(dir, fName);
        try {
          if (fs.existsSync(fPath)) {
            const fileData = fs.readFileSync(fPath);
            socket.write(STATUS_OK);
            socket.write(`Content-Type: application/octet-stream${CRLF}`);
            socket.write(`Content-Length: ${fileData.length}${CRLF}`);
            socket.write(`${CRLF}`);
            socket.write(`${fileData}${CRLF}${CRLF}`);
          } else {
            socket.write(STATUS_NOTFOUND);
          }
        } catch (error) {
          socket.write(STATUS_NOTFOUND);
        }
      } else if (path.startsWith("/user-agent")) {
        const userAgent = headersKeyValue["User-Agent"];

        socket.write(STATUS_OK);
        socket.write(`Content-Type: text/plain${CRLF}`);
        socket.write(`Content-Length: ${userAgent.length}${CRLF}`);
        socket.write(`${CRLF}`);
        socket.write(`${userAgent}${CRLF}${CRLF}`);
      } else if (path.startsWith("/echo")) {
        const string = path.substring(6);

        socket.write(STATUS_OK);
        socket.write(`Content-Type: text/plain${CRLF}`);
        socket.write(`Content-Length: ${string.length}${CRLF}`);
        socket.write(`${CRLF}`);
        socket.write(`${string}${CRLF}${CRLF}`);
      } else if (path === "/") {
        socket.write(`${STATUS_OK}${CRLF}`);
      } else {
        socket.write(STATUS_NOTFOUND);
      }
    } else if (method === METHODS.POST) {
      if (path.startsWith("/files")) {
        const body = Object.keys(headersKeyValue)[Object.keys(headersKeyValue).length - 1];
        console.log(body);
        const fName = path.substring(7);
        const fPath = pathModule.join(dir, fName);
        try {
          const fileStream = fs.writeFileSync(fPath, body);
          socket.write(STATUS_CREATED);
        } catch (error) {
          console.log(error);
          socket.write(STATUS_NOTFOUND);
        }
      }
    } else {
      socket.write(STATUS_NOTFOUND);
    }
    socket.end();
  });
  socket.on("close", () => {
    socket.end();
    // server.close();
  });
});

server.listen(4221, "localhost");
