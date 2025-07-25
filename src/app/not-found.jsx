"use client";
import Link from "next/link";

const isDev = process.env.NODE_ENV === 'development';
const href = isDev ? "/status" : "/status.html";

export default function NotFound() {
  return (
    <div className="container-fluid d-flex flex-column align-items-center justify-content-center" 
         style={{ 
           minHeight: "100vh", 
           backgroundColor: "#ffffff",
           fontFamily: "Arial, sans-serif"
         }}>
      
      <div className="text-center" style={{ maxWidth: "500px", padding: "2rem" }}>
        
        <h1 style={{ 
          fontSize: "6rem", 
          fontWeight: "700", 
          color: "#ef1212ff",
          margin: "0 0 1rem 0",
          lineHeight: "1",
          letterSpacing: "-2px"
        }}>
          404
        </h1>
        
        <h2 style={{ 
          fontSize: "1.75rem", 
          color: "#34495e",
          margin: "0 0 1.5rem 0",
          fontWeight: "600",
          letterSpacing: "0.5px"
        }}>
          Page Not Found
        </h2>
        
        <p style={{ 
          fontSize: "1.1rem", 
          color: "#7f8c8d",
          lineHeight: "1.7",
          margin: "0 0 2.5rem 0",
          fontWeight: "400"
        }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <Link 
          href={href} 
          className="btn"
          style={{
            backgroundColor: "#27ae60",
            color: "white",
            padding: "0.6rem 1.5rem",
            fontSize: "0.95rem",
            fontWeight: "500",
            textDecoration: "none",
            borderRadius: "6px",
            border: "none",
            display: "inline-block",
            transition: "all 0.3s ease",
            boxShadow: "0 2px 4px rgba(39, 174, 96, 0.2)",
            letterSpacing: "0.5px"
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "#229954";
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 4px 8px rgba(39, 174, 96, 0.3)";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "#27ae60";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 2px 4px rgba(39, 174, 96, 0.2)";
          }}
        >
          Go Home
        </Link>
        
      </div>
    </div>
  );
}