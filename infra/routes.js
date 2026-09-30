// eslint-disable-next-line @typescript-eslint/no-unused-vars -- CloudFront invokes this entrypoint.
function handler(event) {
  var request = event.request;
  var routes = ["/", "/plan/", "/trip/", "/share/", "/docs/", "/auth/callback/"];
  var path = request.uri;
  if (path !== "/" && path.charAt(path.length - 1) !== "/" && routes.indexOf(path + "/") >= 0) {
    return {
      statusCode: 301,
      headers: { location: { value: path + "/" + query(request.querystring) } },
    };
  }
  if (routes.indexOf(path) >= 0) request.uri = path + "index.html";
  return request;
}
function query(values) {
  var parts = [];
  for (var key in values) {
    var entries = values[key].multiValue || [values[key]];
    for (var i = 0; i < entries.length; i++) parts.push(key + "=" + entries[i].value);
  }
  return parts.length ? "?" + parts.join("&") : "";
}
