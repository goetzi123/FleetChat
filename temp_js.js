        // Event data and messages
        const eventData = {
            route: {
                message: "New delivery route assigned: ACME Corp, 123 Industrial Blvd, Chicago IL. Please confirm receipt and estimated departure time.",
                responses: ["Confirm Route", "Need Navigation", "Report Delay"]
            },
            pickup: {
                message: "Pickup reminder: ACME Corp at 123 Industrial Blvd in 30 minutes. Need any navigation assistance?",
                responses: ["On My Way", "Send Location", "Running Late"]
            },
            arrival: {
                message: "Arrived at ACME Corp. Please share loading status and any delays.",
                responses: ["Loading Started", "Share Location", "Upload Photo"]
            },
            document: {
                message: "Please upload signed delivery receipt and any customer notes for ACME Corp delivery.",
                responses: ["Upload POD", "Add Notes", "Customer Signature"]
            },
            hos: {
                message: "HOS Alert: 1 hour remaining on duty. Plan for required rest period.",
                responses: ["Find Rest Area", "Extension Request", "Off Duty Soon"]
            },
            geofence: {
                message: "Entered Chicago Distribution Center. Please confirm your activity and estimated duration.",
                responses: ["Loading Activity", "Maintenance Stop", "Driver Break"]
            }
        };

        function triggerEvent(eventType) {
            const event = eventData[eventType];
            if (!event) return;

            // Update Samsara status
            updateSamsaraStatus(`Processing ${eventType} event...`);
            
            // Show typing indicator
            setTimeout(() => {
                showTypingIndicator();
            }, 500);
            
            // Send WhatsApp message
            setTimeout(() => {
                hideTypingIndicator();
                addWhatsAppMessage(event.message, 'fleet');
                showResponseOptions(event.responses, eventType);
            }, 2000);
            
            // Update Samsara status
            setTimeout(() => {
                updateSamsaraStatus(`Event sent to driver. Awaiting response...`);
            }, 2500);
        }

        function addWhatsAppMessage(message, sender) {
            const messagesContainer = document.getElementById('whatsapp-messages');
            
            // Clear placeholder if it exists
            if (messagesContainer.querySelector('.text-center')) {
                messagesContainer.innerHTML = '';
            }
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `message-enter ${sender === 'fleet' ? 'ml-4' : 'mr-4'}`;
            
            messageDiv.innerHTML = `
                <div class="${sender === 'fleet' ? 'bg-blue-500 text-white ml-auto' : 'bg-white text-gray-900'} rounded-lg p-3 max-w-xs shadow-sm">
                    <div class="text-sm">${message}</div>
                    <div class="text-xs mt-1 ${sender === 'fleet' ? 'text-blue-100' : 'text-gray-500'}">${new Date().toLocaleTimeString()}</div>
                </div>
            `;
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function showTypingIndicator() {
            const messagesContainer = document.getElementById('whatsapp-messages');
            const typingDiv = document.createElement('div');
            typingDiv.id = 'typing-indicator';
            typingDiv.className = 'typing mr-4';
            typingDiv.innerHTML = `
                <div class="bg-gray-200 rounded-lg p-3 max-w-xs">
                    <div class="flex space-x-1">
                        <div class="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                        <div class="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
                        <div class="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
                    </div>
                </div>
            `;
            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function hideTypingIndicator() {
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }

        function showResponseOptions(responses, eventType) {
            const optionsContainer = document.getElementById('response-options');
            optionsContainer.innerHTML = '';
            
            responses.forEach(response => {
                const button = document.createElement('button');
                button.className = 'w-full text-left p-3 bg-green-100 border border-green-200 rounded-lg hover:bg-green-200 transition-colors mb-2';
                button.textContent = response;
                button.onclick = () => sendDriverResponse(response, eventType);
                optionsContainer.appendChild(button);
            });
        }

        function sendDriverResponse(response, eventType) {
            // Add driver message to WhatsApp
            addWhatsAppMessage(response, 'driver');
            
            // Clear response options
            const optionsContainer = document.getElementById('response-options');
            optionsContainer.innerHTML = '<div class="text-sm text-gray-600">Response sent to FleetChat</div>';
            
            // Update Samsara with driver response
            setTimeout(() => {
                updateSamsaraStatus(`Driver responded: "${response}". Updating transport record...`);
            }, 1000);
            
            setTimeout(() => {
                updateSamsaraStatus(`Transport status updated. ${getStatusUpdate(eventType, response)}`);
            }, 2500);
        }

        function getStatusUpdate(eventType, response) {
            const updates = {
                route: "Route confirmed. ETA logged.",
                pickup: "Pickup status updated. On schedule.",
                arrival: "Arrival confirmed. Loading in progress.",
                document: "Document received. POD uploaded to transport record.",
                hos: "HOS status updated. Compliance maintained.",
                geofence: "Activity logged. Duration estimated."
            };
            return updates[eventType] || "Status updated successfully.";
        }

        function updateSamsaraStatus(message) {
            const statusContainer = document.getElementById('samsara-status');
            const statusDiv = document.createElement('div');
            statusDiv.className = 'text-sm text-gray-700 p-2 bg-blue-50 rounded border-l-4 border-blue-400 status-update';
            statusDiv.innerHTML = `<strong>${new Date().toLocaleTimeString()}:</strong> ${message}`;
            
            statusContainer.appendChild(statusDiv);
            
            // Keep only last 5 status messages
            const statusMessages = statusContainer.querySelectorAll('.status-update');
            if (statusMessages.length > 5) {
                statusMessages[0].remove();
            }
        }

        function clearDemo() {
            // Clear WhatsApp messages
            document.getElementById('whatsapp-messages').innerHTML = `
                <div class="text-center text-gray-500 text-sm py-8">
                    FleetChat messages will appear here when you trigger Samsara events
                </div>
            `;
            
            // Clear response options
            document.getElementById('response-options').innerHTML = `
                <div class="text-sm text-gray-600">Response options will appear when messages are received</div>
            `;
            
            // Reset Samsara status
            document.getElementById('samsara-status').innerHTML = `
                <div class="text-sm text-gray-600">Ready to process events...</div>
            `;
        }
