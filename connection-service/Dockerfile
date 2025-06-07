FROM node

# Set the working directory ( where commands are executed ) inside the container
WORKDIR /

COPY package.json package-lock.json ./

# Install dependencies (if necessary)
RUN npm install

# Step 4: Copy the rest of the application files
COPY . .

# Step 5: Expose port 8001 (the app will run on this port of container)
EXPOSE 8004

# Step 6: Set the command to run the app
CMD ["npm", "run" , "start"]