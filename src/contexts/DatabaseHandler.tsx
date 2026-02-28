/*
1. Needs to be able to handle transitions between fastapi and react by 
pulling up the user's data from the db. Should happen once here and not per 
each file it needs to happen in.
2. This should also handle making a user if its their first time loggin in
Needs to securely be able to store the user's googleid then convert it 
to a id in this db that can be used so if I integrate appleid, there will
be one centralized id system in place.
3. Figure out how to be the middleman between backend and frontend. Handle
the heavy lifting, logic, testing, error handling, etc. so the frontend can 
just call functions that return data
4. Needs to check if the user's googleid is in the db first before making 
a brand new user, if its not there, make a new user with the googleid and 
then return the user's data. If it is there, just return the user's data.
 This way we can handle both new and returning users seamlessly.
*/