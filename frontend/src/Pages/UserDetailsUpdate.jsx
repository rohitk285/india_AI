import React, { useState, useEffect, useContext } from "react";
import {
    Box, Typography, Card, CardContent, Grid, TextField, List, ListItem, ListItemText, Link, Button
} from "@mui/material";
import Navbar from "../components/Navbar";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const UserDetailsPage = () => {
    const location = useLocation();
    const cust_id = location.state?.cust_id;
    const [user, setUser] = useState(null);
    const [editingUser, setEditingUser] = useState({});
    const [editMode, setEditMode] = useState({});
    const [links, setLinks] = useState([]);
    const [showUpdateBtn, setShowUpdateBtn] = useState(false);
    const user_id = useContext(AuthContext).userId;

    // Fetch user details
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.post("http://localhost:8080/api/customerDetailsCustID", {
                    cust_id: cust_id,
                    user_id: user_id
                });
                setUser(response.data);
                setEditingUser(response.data);
                initializeEditMode(response.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchUser();
    }, [cust_id]);

    // Fetch document links
    useEffect(() => {
        if (user?.document_type) {
            const fetchLinks = async () => {
                try {
                    const response = await axios.post("http://localhost:8080/api/customerDetailsLinks", {
                        cust_id: cust_id,
                        document_type: user.document_type
                    });
                    setLinks(response.data || []);
                } catch (err) {
                    console.error(err);
                }
            };
            fetchLinks();
        }
    }, [user]);

    const initializeEditMode = (userData) => {
        const mode = { entities: {} };
        if (userData.entities) {
            Object.keys(userData.entities).forEach((key) => {
                mode.entities[key] = false;
            });
        }
        setEditMode(mode);
    };

    const handleDoubleClick = (key, isEntity = false) => {
        if (isEntity) {
            setEditMode(prev => ({ ...prev, entities: { ...prev.entities, [key]: true } }));
        } else {
            setEditMode(prev => ({ ...prev, [key]: true }));
        }
    };

    const handleChange = (key, value, isEntity = false) => {
        if (isEntity) {
            setEditingUser(prev => ({ ...prev, entities: { ...prev.entities, [key]: value } }));
        } else {
            setEditingUser(prev => ({ ...prev, [key]: value }));
        }
        setShowUpdateBtn(true);
    };

    const handleUpdate = async () => {
        try {
            await axios.patch(`http://localhost:8080/api/customer/${cust_id}`, editingUser);
            alert("Customer details updated successfully!");
            setUser(editingUser);
            initializeEditMode(editingUser);
            setShowUpdateBtn(false);
        } catch (err) {
            console.error(err);
            alert("Update failed!");
        }
    };

    if (!user) return <Typography sx={{ padding: 2, color: "#FF5722" }}>User not found</Typography>;

    return (
        <>
            <Navbar />
            <Box sx={{ padding: 4, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
                <Typography variant="h4" sx={{ fontWeight: "bold", marginBottom: 4, color: "#111810" }}>
                    User Details
                </Typography>

                <Card sx={{ padding: 4, borderRadius: 2 }}>
                    <CardContent>
                        <Grid container spacing={3}>
                            {/* Entities */}
                            {editingUser.entities && Object.keys(editingUser.entities).map((key) => (
                                <Grid item xs={12} sm={6} key={key}>
                                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "#FF5722" }}>{key}:</Typography>
                                    {Array.isArray(editingUser.entities[key]) ? (
                                        <List sx={{ backgroundColor: "#eeeeee", borderRadius: 1, p: 1 }}>
                                            {editingUser.entities[key].map((item, i) => (
                                                <ListItem key={i}><ListItemText primary={item} /></ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <TextField
                                            fullWidth
                                            value={editingUser.entities[key]}
                                            onChange={(e) => handleChange(key, e.target.value, true)}
                                            onDoubleClick={() => handleDoubleClick(key, true)}
                                            InputProps={{ readOnly: !editMode.entities[key] }}
                                            sx={{ backgroundColor: "#fff", borderRadius: 1, mb: 2 }}
                                        />
                                    )}
                                </Grid>
                            ))}

                            {/* Update Button */}
                            {showUpdateBtn && (
                                <Grid item xs={12}>
                                    <Button variant="contained" color="primary" onClick={handleUpdate}>Update</Button>
                                </Grid>
                            )}
                        </Grid>
                    </CardContent>
                </Card>
            </Box>
        </>
    );
};

export default UserDetailsPage;
