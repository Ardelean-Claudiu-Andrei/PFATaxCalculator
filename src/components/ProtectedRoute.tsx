import React from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../../firebase"; // ajustează calea

type Props = { children: React.ReactElement };

const ProtectedRoute: React.FC<Props> = ({ children }) => {
    const user = auth.currentUser;
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

export default ProtectedRoute;
