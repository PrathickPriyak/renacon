-- CreateTable
CREATE TABLE "ProductSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formType" TEXT NOT NULL DEFAULT 'product',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "product" TEXT NOT NULL DEFAULT '',
    "productPath" TEXT NOT NULL DEFAULT '',
    "pageUrl" TEXT NOT NULL DEFAULT '',
    "detailsJson" TEXT NOT NULL DEFAULT '{}'
);

-- CreateTable
CREATE TABLE "CareerSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formType" TEXT NOT NULL DEFAULT 'career',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "altPhone" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT '',
    "experience" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "qualification" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL DEFAULT '',
    "pageUrl" TEXT NOT NULL DEFAULT '',
    "photoOriginalName" TEXT NOT NULL DEFAULT '',
    "photoStoredName" TEXT NOT NULL DEFAULT '',
    "photoStoragePath" TEXT NOT NULL DEFAULT '',
    "photoMimeType" TEXT NOT NULL DEFAULT '',
    "photoSize" INTEGER NOT NULL DEFAULT 0,
    "resumeOriginalName" TEXT NOT NULL DEFAULT '',
    "resumeStoredName" TEXT NOT NULL DEFAULT '',
    "resumeStoragePath" TEXT NOT NULL DEFAULT '',
    "resumeMimeType" TEXT NOT NULL DEFAULT '',
    "resumeSize" INTEGER NOT NULL DEFAULT 0,
    "detailsJson" TEXT NOT NULL DEFAULT '{}'
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "formType" TEXT NOT NULL DEFAULT 'contact',
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT '',
    "products" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL DEFAULT '',
    "pageUrl" TEXT NOT NULL DEFAULT '',
    "detailsJson" TEXT NOT NULL DEFAULT '{}'
);
