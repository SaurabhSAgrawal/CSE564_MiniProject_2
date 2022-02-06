from flask import Flask, render_template, url_for
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import json
from flask import request
from flask import jsonify
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
import matplotlib.style as style
from sklearn.preprocessing import MaxAbsScaler

app = Flask(__name__)

attrArr = []


@app.route("/", methods=['POST', 'GET'])
def index():
    global attrArr
    if request.method == 'POST':
        if request.form['request'] == 'screePlot':
            data = {'screePlotData': json.dumps(eigenValuePercent)}
            # print(data)
            return jsonify(data)
        elif request.form['request'] == 'topLoading':
            countPCAComponent = int(request.form['countPCAComponent'])
            attrArr = topLoadingAttributes(countPCAComponent)
            data = {'topLoadingData': json.dumps(attrArr)}
            return jsonify(data)
        elif request.form['request'] == 'scatterPlotMatrix':
            attrArrLocal = attrArr
            attrArrLocal.append("ClusterID")
            spmDF = X_stdDF[attrArrLocal]
            data = {'scatterPlotMatrixData': json.dumps(
                spmDF.to_dict(orient='records'), indent=2)}
            return jsonify(data)
        elif request.form['request'] == 'pcaBiplot':
            pca = PCA(n_components=2)
            components = pca.fit_transform(X_std)
            pcaBiplotDF = pd.DataFrame(data=components, columns=[
                'PC1', 'PC2'])

            # Normalizing [-1,+1]
            scaler = MaxAbsScaler()
            pcaBiplotDF = scaler.fit_transform(pcaBiplotDF)
            pcaBiplotDF = pd.DataFrame(
                data=pcaBiplotDF, columns=['PC1', 'PC2'])
            pcaBiplotDF['ClusterID'] = clusterIDVals

            # print(pcaBiplotDF)

            loadingsPCABiplot = pca.components_.T * \
                np.sqrt(pca.explained_variance_)

            column_names = []
            for i in range(0, 2):
                column_names.append("PC" + str(i + 1))

            # LoadingsMatrix is a correlation matrix between the original variables and Principal Components
            loadingsMatrixPCABiplot = pd.DataFrame(
                loadingsPCABiplot, columns=column_names, index=numericalDF.columns.tolist())
            loadingsMatrixPCABiplot['attr'] = numericalDF.columns.tolist()

            data = {'pcaBiplotDatapoints': json.dumps(
                pcaBiplotDF.to_dict(orient='records'), indent=2), 'pcaBiplotVariablesLoadings': json.dumps(
                loadingsMatrixPCABiplot.to_dict(orient='records'), indent=2)}
            return jsonify(data)
    else:
        return render_template('index.html')


if __name__ == '__main__':
    # Read csv data into dataframe
    df = pd.read_csv('Udemy_Development_Courses_sampled.csv')

    numericalDF = df.drop(['id', 'title', 'url', 'is_paid', 'discount_price_currency',
                           'price_detail_currency', 'avg_rating', 'avg_rating_recent', 'created', 'published_time'], axis=1)

    # Data Standardization
    X_std = StandardScaler().fit_transform(numericalDF)
    # print(X_std)

    def elbowMethodForOptimalK():
        distortions = []
        K = range(1, 10)
        for k in K:
            kmeans = KMeans(n_clusters=k)
            kmeans.fit(numericalDF)
            # inertia is WSS: Within cluster sum of square
            distortions.append(kmeans.inertia_)

        plt.figure(figsize=(14, 8))
        style.use("fivethirtyeight")
        plt.plot(K, distortions, 'bo-')
        plt.xlabel('Number of clusters (k)')
        plt.ylabel('Distortion')
        plt.title('The Elbow Method')
        plt.savefig('static/images/kmeansElbowMethod_sampled3.png')

    # elbowMethodForOptimalK()
    numOfClusters = 2  # from elbow method above

    # K means clustering
    kmeans = KMeans(n_clusters=numOfClusters)
    kmeans.fit(X_std)

    # Cluster IDs
    clusterIDVals = kmeans.labels_

    # Adding ClusterID column to X_std dataframe
    X_stdDF = pd.DataFrame(X_std, columns=numericalDF.columns.tolist())
    X_stdDF['ClusterID'] = clusterIDVals
    # print(X_stdDF)

    # Computing Eigenvectors and Eigenvalues
    # mean vector along column
    # mean_vec = np.mean(X_std, axis=0)

    # # Covariance matrix
    # covariance_mat = (X_std - mean_vec).T.dot((X_std -
    #                                            mean_vec)) / (X_std.shape[0])

    # # Eigen decomposition of covariance matrix
    # eigen_vals, eigen_vecs = np.linalg.eig(covariance_mat)

    # # Selecting Principal Components
    # # List of eigenvalue and eigenvector pairs
    # eigen_pairs = [(np.abs(eigen_vals[i]), eigen_vecs[:, i])
    #                for i in range(len(eigen_vals))]
    # print(eigen_pairs)
    # # Sort eigen_pairs in descending order wrt eigenvalue
    # eigen_pairs.sort(key=lambda x: x[0], reverse=True)

    # for i in eigen_pairs:
    #     print(i[0])

    # explained_variance = [(i / sum(eigen_vals)) *
    #                       100 for i in sorted(eigen_vals, reverse=True)]
    # print(explained_variance)

    pca = PCA()
    components = pca.fit_transform(X_std)
    #print("PCA Completed")

    # For Scree Plot
    eigenValuePercent = [round(i * 100, 2)
                         for i in pca.explained_variance_ratio_]
    #
    # print(eigenValuePercent)

    def topLoadingAttributes(countPCAComponent):
        tlPCA = PCA(n_components=countPCAComponent)
        X_std_new = tlPCA.fit_transform(X_std)

        # Calculating loadings
        loadings = tlPCA.components_.T * np.sqrt(tlPCA.explained_variance_)

        column_names = []
        for i in range(0, countPCAComponent):
            column_names.append("PC" + str(i + 1))

        # LoadingsMatrix is a correlation matrix between the original variables and Principal Components
        loadingsMatrix = pd.DataFrame(
            loadings, columns=column_names, index=numericalDF.columns.tolist())
        # print(loadingsMatrix)
        loadingsSquareMatrix = pd.DataFrame(
            np.square(loadings), columns=column_names, index=numericalDF.columns.tolist())
        # print(loadingsSquareMatrix)
        loadingsMatrix['sum of squared loadings'] = loadingsSquareMatrix.sum(
            axis=1)
        # print(loadingsMatrix)
        loadingsMatrixFinal = loadingsMatrix.sort_values(
            'sum of squared loadings', ascending=False)
        print(loadingsMatrixFinal)

        return loadingsMatrixFinal.head(4).index.tolist()

    app.run(debug=True)
