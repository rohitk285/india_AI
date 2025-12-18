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
          document_type: user.document_type
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
          <Grid container spacing={3}>
            {/* Named Entities */}
            {user.entities && (
              <>
                {Object.keys(user.entities).map((entityKey, index) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    key={entityKey}
                    sx={{
                      display: "flex",
                      flexDirection: index % 2 === 0 ? "row" : "row-reverse",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: "bold",
                          color: "#FF5722",
                          marginBottom: 1,
                        }}
                      >
                        {entityKey}:
                      </Typography>
                      {Array.isArray(user.entities[entityKey]) ? (
                        <List
                          sx={{
                            backgroundColor: "#eeeeee",
                            padding: "10px",
                            borderRadius: "8px",
                          }}
                        >
                          {user.entities[entityKey].map((item, index) => (
                            <ListItem key={index}>
                              <ListItemText
                                primary={item}
                                primaryTypographyProps={{
                                  sx: { fontWeight: "bold", color: "#000000" },
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: "bold",
                            color: "#000000",
                            fontFamily: "Nunito",
                            fontSize: "20px",
                          }}
                        >
                          {user.entities[entityKey]}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                ))}
              </>
            )}

            {/* Related Documents */}
            {user.document_type && (
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "#FF5722" }}
                >
                  Related Documents:
                </Typography>
                <List>
                  {links.map((docObj, index) => {
                    const docType = Object.keys(docObj)[0];
                    const docInfo = docObj[docType];

                    return (
                      <ListItem key={index}>
                        <ListItemText
                          primary={docType}
                          secondary={
                            docInfo?.fileLink ? (
                              <Link
                                href={docInfo.fileLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  color: "#FF5722",
                                  fontWeight: "bold",
                                  textDecoration: "underline",
                                }}
                              >
                                Click here to view
                              </Link>
                            ) : (
                              "No document available"
                            )
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserDetailsPage;
