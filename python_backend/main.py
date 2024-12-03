from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from transformers import AutoModel, AutoTokenizer
import numpy as np

from database import SessionLocal, Document  # Import from the database setup

app = FastAPI()

# Dependency for database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from pydantic import BaseModel
from transformers import pipeline

class DocumentIn(BaseModel):
    title: str
    content: str

class QuestionIn(BaseModel):
    question: str


from typing import List

class SelectDocumentsRequest(BaseModel):
    document_ids: List[int]

selected_document_ids = []

@app.post("/ingest")
async def ingest_document(document: DocumentIn, db: Session = Depends(get_db)):
    # Load LLM model and tokenizer
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)

    # Generate embedding
    inputs = tokenizer(document.content, return_tensors="pt", padding=True, truncation=True)
    outputs = model(**inputs)
    embedding = outputs.last_hidden_state.mean(dim=1).detach().numpy().tolist()

    # Store in database
    new_document = Document(title=document.title, content=document.content, embedding=str(embedding))
    db.add(new_document)
    db.commit()
    db.refresh(new_document)
    return {"id": new_document.id, "message": "Document ingested successfully"}

@app.post("/select-documents")
async def select_documents(request: SelectDocumentsRequest):
    global selected_document_ids
    selected_document_ids = request.document_ids
    return {
        "message": "Documents selected successfully",
        "selected_documents": selected_document_ids,
    }

@app.post("/qna")
async def ask_question(payload: QuestionIn, db: Session = Depends(get_db)):
    question = payload.question

    # Load model and tokenizer
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModel.from_pretrained(model_name)

    # Retrieve embeddings from DB
    documents = db.query(Document).filter(Document.id.in_(selected_document_ids)).all()
    if not documents:
        raise HTTPException(status_code=404, detail="No selected documents found")
    if not documents:
        raise HTTPException(status_code=404, detail="No documents found")

    embeddings = np.array([eval(doc.embedding) for doc in documents])
    titles = [doc.title for doc in documents]
    contents = [doc.content for doc in documents]

    # Generate question embedding
    question_inputs = tokenizer(question, return_tensors="pt", padding=True, truncation=True)
    question_outputs = model(**question_inputs)
    question_embedding = question_outputs.last_hidden_state.mean(dim=1).detach().numpy()

    # Find the most similar document (cosine similarity)
    similarity_scores = np.dot(embeddings, question_embedding.T).flatten()
    best_match_index = similarity_scores.argmax()

    # Use an LLM for RAG-based answer generation
    qa_pipeline = pipeline("question-answering", model="deepset/roberta-base-squad2")
    answer = qa_pipeline(question=question, context=contents[best_match_index])

    return {
        "best_match": titles[best_match_index],
        "similarity": similarity_scores[best_match_index],
        "answer": answer["answer"]
    }


@app.get("/documents")
async def list_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).all()
    return [{"id": doc.id, "title": doc.title} for doc in documents]
