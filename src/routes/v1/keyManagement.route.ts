import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { keyManagementController, keyManagementValidation } from '../../modules/keyManagement';

const router: Router = express.Router();

router
  .route('/generate-blowfish-key')
  .post(
    // auth('manageKeyManagements'),
    // validate(keyManagementValidation.createKeyManagement),
    keyManagementController.generateBlowfishKey
  )
  .get(validate(keyManagementValidation.getKeyManagements), keyManagementController.getKeyManagements);

router
  .route('/generate-edcsa-key')
  .post(
    // auth('manageKeyManagements'),
    // validate(keyManagementValidation.createKeyManagement),
    keyManagementController.generateECDSAKey
  )
  .get(validate(keyManagementValidation.getKeyManagements), keyManagementController.getKeyManagements);

router
  .route('/:keyManagementId')
  .get(auth('getKeyManagements'), validate(keyManagementValidation.getKeyManagement), keyManagementController.getKeyManagement)
  .patch(
    // auth('manageKeyManagements'),
    validate(keyManagementValidation.updateKeyManagement),
    keyManagementController.updateKeyManagement
  )
  .delete(
    // auth('manageKeyManagements'),
    validate(keyManagementValidation.deleteKeyManagement),
    keyManagementController.deleteKeyManagement
  );

export default router;

/**
 * @swagger
 * tags:
 *   name: KeyManagements
 *   description: KeyManagement management and retrieval
 */

/**
 * @swagger
 * /keyManagements:
 *   post:
 *     summary: Create a keyManagement
 *     description: Only admins can create other keyManagements.
 *     tags: [KeyManagements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 description: must be unique
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number and one letter
 *               role:
 *                  type: string
 *                  enum: [keyManagement, admin]
 *             example:
 *               name: fake name
 *               email: fake@example.com
 *               password: password1
 *               role: keyManagement
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/KeyManagement'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Get all keyManagements
 *     description: Only admins can retrieve all keyManagements.
 *     tags: [KeyManagements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: KeyManagement name
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: KeyManagement role
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: sort by query in the form of field:desc/asc (ex. name:asc)
 *       - in: query
 *         name: projectBy
 *         schema:
 *           type: string
 *         description: project by query in the form of field:hide/include (ex. name:hide)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of keyManagements
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/KeyManagement'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /keyManagements/{id}:
 *   get:
 *     summary: Get a keyManagement
 *     description: Logged in keyManagements can fetch only their own keyManagement information. Only admins can fetch other keyManagements.
 *     tags: [KeyManagements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: KeyManagement id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/KeyManagement'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Update a keyManagement
 *     description: Logged in keyManagements can only update their own information. Only admins can update other keyManagements.
 *     tags: [KeyManagements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: KeyManagement id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 description: must be unique
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: At least one number and one letter
 *             example:
 *               name: fake name
 *               email: fake@example.com
 *               password: password1
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/KeyManagement'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a keyManagement
 *     description: Logged in keyManagements can delete only themselves. Only admins can delete other keyManagements.
 *     tags: [KeyManagements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: KeyManagement id
 *     responses:
 *       "200":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
