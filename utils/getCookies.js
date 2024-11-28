
export default function getcookies(req) {
    var cookie = req.headers.cookie;
    if (!cookie) return {};
    const cookiesObject = {}
    cookie.split('; ').forEach(element => {
        const oneCookie = element.split('=');
        cookiesObject[[oneCookie[0]]] = oneCookie[1];
    });
    // user=someone; session=mySessionID

    return cookiesObject;
}