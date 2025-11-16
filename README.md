# chatbot-tr-2024-monorepo
Research work (Treball de recerca)

## Monorepo for Batxillerat Research Project Code

This repository contains the code developed for my **Treball de Recerca** (Research Project) during the **2023-2024 academic year**. The project focuses on creating a chatbot, and this monorepo houses its various components.

---

### Important Notes & Disclaimers:

1.  **Code Scrubbed/Anonymized:**
    It is crucial to understand that the code within this repository has been carefully **scrubbed and anonymized**. This means any sensitive personal information, specific institutional details, proprietary data, or elements that could compromise privacy or academic integrity have been removed or generalized. The intention is to showcase the technical work and project structure without revealing confidential aspects.

2.  **No Git History:**
    This repository **does not retain any of the original Git commit history**. It is presented as a snapshot of the finalized (or near-finalized) code, compiled and pushed to this public repository for portfolio and demonstration purposes.

---

### What is a *Treball de Recerca*?

For those unfamiliar with the Catalan education system, a **Treball de Recerca (TR)**, which translates to 'Research Project' or 'Research Work,' is a compulsory and significant academic project undertaken by students in their final two years of *Batxillerat*.

*   **Context:** *Batxillerat* is the post-compulsory secondary education stage in Catalonia (Spain), typically spanning two years (ages 16-18), roughly equivalent to A-Levels in the UK or the final years of high school leading to university entrance in many other systems.
*   **Purpose:** The TR is a substantial individual research project where students choose a topic of interest, conduct in-depth research, analyze findings, and typically produce a comprehensive written report. Often, it also includes a practical component, such as an experiment, a prototype, or, in my case, a software application like a chatbot.
*   **Skills Developed:** This project aims to foster critical thinking, advanced research skills, project management, independent learning, and the ability to synthesize information from various sources. It culminates in a public presentation and defense of the project.

My particular project, `chatbot-tr-2024-monorepo`, is focused on exploring and implementing a conversational AI agent as part of this academic endeavor.

---

### Monorepo Structure

This repository is structured as a monorepo, meaning it houses multiple distinct projects or components that together form the complete chatbot system. Each directory represents a key part of the architecture:

*   `chatbot-tr-2024-api/`: Contains the backend API services. This handles the core logic, processing requests, and interfacing with other components like the RAG system.
*   `chatbot-tr-2024-app/`: The main client application or user interface. This is likely where users interact with the chatbot.
*   `chatbot-tr-2024-rag/`: Dedicated to the **Retrieval Augmented Generation (RAG)** system. This component is responsible for retrieving relevant information from a knowledge base and using it to enhance the chatbot's responses with factual and up-to-date context.
*   `chatbot-tr-2024-webdataextract/`: A utility or script package for extracting and processing data from the web. This data likely serves as the foundation for the RAG system's knowledge base or for training purposes.

---

### Purpose of this Repository

The primary goal of making this scrubbed code available is for **portfolio purposes**. It serves to demonstrate the technical skills, project development process, and research capabilities involved in my *Treball de Recerca*, while fully respecting privacy and academic integrity requirements.
