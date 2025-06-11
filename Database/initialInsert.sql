INSERT INTO mitarbeiterportal.h_customer
(hk_customer, customer_name, t_from, rec_src)
VALUES 
(to_hash())   




-- Hub für Kunden
CREATE TABLE IF NOT EXISTS mitarbeiterportal.h_customer (
    hk_customer UUID PRIMARY KEY DEFAULT(to_hash(customer_id)),
    customer_id VARCHAR(255) UNIQUE NOT NULL,10007
    rec_src VARCHAR(255) NOT NULL -- was ist das?
);


-- Satellite für Kundendetails (bitemporal)
CREATE TABLE IF NOT EXISTS mitarbeiterportal.s_customer_details (
    hk_customer UUID NOT NULL,
    customer_name VARCHAR(255) UNIQUE NOT NULL,
    contact_person VARCHAR(255),
    address VARCHAR(255),git push
    b_from DATE NOT NULL DEFAULT CURRENT_DATE,
    b_to DATE NULL,
    t_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    t_to TIMESTAMP NULL,
    rec_src VARCHAR(255) NOT NULL,
    PRIMARY KEY (hk_customer, b_from),
    FOREIGN KEY (hk_customer) REFERENCES h_customer(hk_customer)
);
