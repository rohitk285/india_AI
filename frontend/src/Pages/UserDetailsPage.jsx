import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Link,
} from "@mui/material";
import { useLocation } from "react-router-dom"; // To retrieve data passed through the router
import axios from "axios";
import { use } from "react";
import { AuthContext } from "../context/AuthContext";

const UserDetailsPage = () => {
  const location = useLocation();
  const cust_id = location.state?.userData;
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState([]);
  const user_id = useContext(AuthContext).userId;

  async function getUserDetails() {
    try {
      const response = await axios.post(
        "http://localhost:8080/api/customerDetailsCustID",
        {
          cust_id: cust_id,
          user_id: user_id,
        }
      );
      console.log("User details fetched:", response.data);
      setUser(response.data);
    } catch (err) {
      console.error("Cannot fetch user details", err);
    }
  }

  async function getLinks() {
    try {
      const response = await axios.post(
        "http://localhost:8080/api/customerDetailsLinks",
        {
          cust_id: cust_id,
          document_type: user.document_type,
        }
      );
      setLinks(response.data);
    } catch (err) {
      console.error("Cannot fetch user links", err);
    }
  }

  useEffect(() => {
    getUserDetails();
  }, []);

  useEffect(() => {
    if (user && user.document_type) {
      getLinks();
    }
  }, [user]);

  if (!user) {
    return (
      <Typography variant="h5" sx={{ color: "#FF5722", padding: 2 }}>
        User not found
      </Typography>
    );
  }

  return (
    <Box sx={{ padding: 4, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: "bold",
          marginBottom: 4,
          color: "#111810",
          fontFamily: "Oswald",
        }}
      >
        User Details
      </Typography>
      <Card
        sx={{
          padding: 4,
          backgroundColor: "#FFFFFF",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
        }}
      >
        <CardContent>
          <Grid container spacing={4}>
            {Array.isArray(user) &&
              user.map((doc, index) => {
                const { document_type, ...fields } = doc;

                return (
                  <Grid item xs={12} md={6} key={index}>
                    <Card
                      sx={{
                        height: "100%",
                        borderRadius: 3,
                        boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      <CardContent>
                        {/* Document Type Header */}
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: "bold",
                            mb: 2,
                            color: "#FF5722",
                            textTransform: "uppercase",
                            borderBottom: "2px solid #FF5722",
                            pb: 1,
                          }}
                        >
                          {document_type || "Document"}
                        </Typography>

                        {/* Fields */}
                        <Grid container spacing={2}>
                          {Object.entries(fields).map(([key, value]) => (
                            <Grid item xs={12} key={key}>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  backgroundColor: "#ffffff",
                                  padding: "10px 14px",
                                  borderRadius: 2,
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontWeight: 600,
                                    color: "#555",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {key.replace(/_/g, " ")}
                                </Typography>

                                <Typography
                                  sx={{
                                    fontWeight: 700,
                                    color: "#000",
                                    maxWidth: "60%",
                                    textAlign: "right",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {value ?? "—"}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserDetailsPage;
