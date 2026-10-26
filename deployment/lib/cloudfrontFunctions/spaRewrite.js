function handler(event) {
  var request = event.request;
  var accept = request.headers.accept
    ? request.headers.accept.value
    : "";

  if (
    (request.method === "GET" || request.method === "HEAD") &&
    accept.indexOf("text/html") !== -1
  ) {
    request.uri = "/index.html";
  }

  return request;
}
