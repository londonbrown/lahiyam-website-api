enum DevOrigins {
  LOCAL = "localhost",
  DEV = "dev.api.lahiyam.com"
}

namespace DevOrigins {
  export function getAllowedOriginFromEvent(event: any) {
    let origin = event.headers.Origin;
    console.log("EVENT", event);
    console.log("ORIGIN", origin);
    if (origin in DevOrigins) {
      return origin;
    } else {
      return DevOrigins.DEV;
    }
  }
}

export default DevOrigins;
